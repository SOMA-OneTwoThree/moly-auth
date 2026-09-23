import type { SupabaseClient, User } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMe } from "../service";

/**
 * PostgREST 쿼리 빌더는 체이닝 후 await되는 thenable이다. 어떤 메서드를 부르든 자신을
 * 돌려주고, await 시 테이블별 고정 결과로 resolve하는 스텁으로 실제 service.ts를 그대로 실행한다.
 */
function fakeAdmin(tables: Record<string, { data: unknown; error: null }>): SupabaseClient {
  return {
    rpc: async (name: string, args: { p_user_id: string }) => {
      if (name === "subscription_launch_access") {
        const rows = tables.app_config.data as { key: string; value: unknown }[];
        const launch = rows.find(row => row.key === "subscription_launch")?.value as Record<string, unknown> | undefined;
        const cutoff = typeof launch?.existing_user_cutoff === "string" ? Date.parse(launch.existing_user_cutoff) : NaN;
        const expiry = typeof launch?.legacy_offer_expires_at === "string" ? Date.parse(launch.legacy_offer_expires_at) : NaN;
        return { data: { enabled: launch?.enabled === true && Number.isFinite(cutoff),
          legacy_offer_eligible: Date.parse(createdByUser.get(args.p_user_id) ?? "") < cutoff && expiry > Date.now() && expiry > cutoff }, error: null };
      }
      return { data: { ios_offer_ready: false, android_offer_ready: false, claimed_offer: null }, error: null };
    },
    from(table: string) {
      const result = tables[table];
      if (result === undefined) throw new Error(`스텁에 없는 테이블: ${table}`);
      const builder: unknown = new Proxy(
        {},
        {
          get(_target, prop) {
            if (prop === "then") {
              return (resolve: (value: unknown) => unknown) => resolve(result);
            }
            return () => builder;
          },
        },
      );
      return builder;
    },
  } as unknown as SupabaseClient;
}

function admin(nickname: string | null, config: Record<string, unknown> = {}, appTrialStartedAt: string | null = null): SupabaseClient {
  return fakeAdmin({
    profiles: {
      data: {
        id: "11111111-1111-1111-1111-111111111111",
        nickname,
        language: "ko",
        timezone: "Asia/Seoul",
        hay_balance: 40,
        trial_ends_at: null,
        review_prompted_at: null,
        app_trial_started_at: appTrialStartedAt,
        app_trial_ends_at: appTrialStartedAt ? new Date(Date.parse(appTrialStartedAt) + 48 * 60 * 60 * 1000).toISOString() : null,
      },
      error: null,
    },
    subscriptions: { data: [], error: null },
    user_daily_stats: { data: null, error: null },
    app_config: { data: Object.entries(config).map(([key, value]) => ({ key, value })), error: null },
    user_items: {
      data: [
        {
          equipped_slot: "theme",
          products: { public_id: "theme_default", is_active: true },
        },
      ],
      error: null,
    },
  });
}

const createdByUser = new Map<string, string>();
function user(createdAt: string): User {
  createdByUser.set("11111111-1111-1111-1111-111111111111", createdAt);
  return {
    id: "11111111-1111-1111-1111-111111111111",
    created_at: createdAt,
  } as User;
}

const JUST_NOW = () => new Date(Date.now() - 500).toISOString();

describe("GET /me 응답 계약 — 신규 가입 신호", () => {
  it("응답 블록 구성은 그대로 유지된다", async () => {
    const me = await getMe(admin("지우"), user(JUST_NOW()));

    expect(Object.keys(me)).toEqual(["profile", "entitlement", "wallet", "equipment", "subscription_rollout"]);
    expect(me.wallet).toEqual({ balance: 40 });
  });

  it("가입 직후 온보딩 미완료 계정은 is_new_signup=true", async () => {
    const me = await getMe(admin(null), user(JUST_NOW()));

    expect(me.profile).toEqual({
      nickname: null,
      timezone: "Asia/Seoul",
      language: "ko",
      onboarded: false,
      is_new_signup: true,
    });
  });

  it("온보딩을 마친 계정은 가입 직후여도 is_new_signup=false", async () => {
    const me = await getMe(admin("지우"), user(JUST_NOW()));

    expect(me.profile).toEqual({
      nickname: "지우",
      timezone: "Asia/Seoul",
      language: "ko",
      onboarded: true,
      is_new_signup: false,
    });
  });

  it("오래된 미완료 계정은 뒤늦게 가입 코호트에 들어가지 않는다", async () => {
    const week = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const me = await getMe(admin(null), user(week));

    expect(me.profile.is_new_signup).toBe(false);
    expect(me.profile.onboarded).toBe(false);
  });
});


describe("GET /me subscription rollout eligibility", () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-24T00:00:00Z")); });
  afterEach(() => vi.useRealTimers());
  const config = { subscription_launch: { enabled: true, existing_user_cutoff: "2026-09-23T00:00:00Z",
    legacy_offer_expires_at: "2026-10-23T00:00:00Z" } };
  it("fails closed by default", async () => {
    const me = await getMe(admin("user"), user("2026-01-01T00:00:00Z"));
    expect(me.subscription_rollout).toEqual({ enabled: false, should_show_paywall: false,
      legacy_offer_eligible: false, self_trial_available: false, has_started_trial: false,
      ios_offer_ready: false, android_offer_ready: false, claimed_offer: null, offer_redeemed: false });
  });
  it("old and new users can start once, only pre-cutoff users qualify for store offer", async () => {
    const old = await getMe(admin("user", config), user("2026-09-22T23:59:59Z"));
    const next = await getMe(admin("user", config), user("2026-09-23T00:00:00Z"));
    expect(old.subscription_rollout.legacy_offer_eligible).toBe(true);
    expect(next.subscription_rollout.legacy_offer_eligible).toBe(false);
    expect(old.subscription_rollout.self_trial_available).toBe(true);
    expect(next.subscription_rollout.self_trial_available).toBe(true);
    expect(old.subscription_rollout.ios_offer_ready).toBe(false);
  });
  it.each([undefined, null, "invalid", "infinity", "2026-09-24T00:00:00Z", "2026-09-23T23:59:59Z"])(
    "missing, invalid or elapsed offer deadline disables store claims only: %s", async (deadline) => {
      const me = await getMe(admin("user", { subscription_launch: {
        ...config.subscription_launch, legacy_offer_expires_at: deadline,
      } }), user("2026-01-01T00:00:00Z"));
      expect(me.subscription_rollout.enabled).toBe(true);
      expect(me.subscription_rollout.legacy_offer_eligible).toBe(false);
      expect(me.subscription_rollout.ios_offer_ready).toBe(false);
      expect(me.subscription_rollout.android_offer_ready).toBe(false);
      expect(me.subscription_rollout.self_trial_available).toBe(true);
    },
  );
  it("deadline does not shorten an already started 48-hour app trial", async () => {
    const me = await getMe(admin("user", { subscription_launch: {
      ...config.subscription_launch, legacy_offer_expires_at: "2026-09-24T00:00:00Z",
    } }, "2026-09-23T12:00:00Z"), user("2026-01-01T00:00:00Z"));
    expect(me.subscription_rollout.legacy_offer_eligible).toBe(false);
    expect(me.entitlement.plan).toBe("trial");
    expect(me.entitlement.trial_ends_at).toBe("2026-09-25T12:00:00.000Z");
  });
  it("expired app trial cannot prompt or start again", async () => {
    const me = await getMe(admin("user", config, "2026-01-01T00:00:00Z"), user("2026-01-01T00:00:00Z"));
    expect(me.subscription_rollout.has_started_trial).toBe(true);
    expect(me.subscription_rollout.self_trial_available).toBe(false);
    expect(me.subscription_rollout.should_show_paywall).toBe(false);
  });
});


describe("GET /me account-scoped enrollment RPC", () => {
  it.each([false, true])("uses server test mode without a production cutoff (legacy=%s)", async (legacy) => {
    const db = admin("tester");
    vi.spyOn(db, "rpc").mockImplementation((async (name: string) => ({
      data: name === "subscription_launch_access"
        ? { enabled: true, legacy_offer_eligible: legacy }
        : { ios_offer_ready: false, android_offer_ready: false, claimed_offer: null, offer_redeemed: false },
      error: null,
    })) as never);
    const me = await getMe(db, user("2026-09-24T00:00:00Z"));
    expect(me.subscription_rollout.enabled).toBe(true);
    expect(me.subscription_rollout.self_trial_available).toBe(true);
    expect(me.subscription_rollout.legacy_offer_eligible).toBe(legacy);
    expect(me.subscription_rollout.ios_offer_ready).toBe(false);
    expect(me.subscription_rollout.android_offer_ready).toBe(false);
    expect(db.rpc).toHaveBeenCalledWith("subscription_launch_access", { p_user_id: "11111111-1111-1111-1111-111111111111" });
  });
  it("unlisted or expired test access leaves purchases closed", async () => {
    const db = admin("tester");
    vi.spyOn(db, "rpc").mockResolvedValue({ data: { enabled: false, legacy_offer_eligible: false }, error: null } as never);
    const me = await getMe(db, user(JUST_NOW()));
    expect(me.subscription_rollout.enabled).toBe(false);
    expect(me.subscription_rollout.should_show_paywall).toBe(false);
    expect(me.subscription_rollout.self_trial_available).toBe(false);
  });
  it("RPC failure does not block /me and never enables purchases", async () => {
    const db = admin("tester");
    vi.spyOn(db, "rpc").mockResolvedValue({ data: null, error: { code: "PGRST202" } } as never);
    const me = await getMe(db, user(JUST_NOW()));
    expect(me.profile.onboarded).toBe(true);
    expect(me.subscription_rollout.enabled).toBe(false);
    expect(me.subscription_rollout.legacy_offer_eligible).toBe(false);
  });
});
