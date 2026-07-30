import type { SupabaseClient, User } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { getMe } from "../service";

/**
 * PostgREST 쿼리 빌더는 체이닝 후 await되는 thenable이다. 어떤 메서드를 부르든 자신을
 * 돌려주고, await 시 테이블별 고정 결과로 resolve하는 스텁으로 실제 service.ts를 그대로 실행한다.
 */
function fakeAdmin(tables: Record<string, { data: unknown; error: null }>): SupabaseClient {
  return {
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

function admin(nickname: string | null): SupabaseClient {
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
      },
      error: null,
    },
    subscriptions: { data: [], error: null },
    user_daily_stats: { data: null, error: null },
    app_config: { data: [], error: null },
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

function user(createdAt: string): User {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    created_at: createdAt,
  } as User;
}

const JUST_NOW = () => new Date(Date.now() - 500).toISOString();

describe("GET /me 응답 계약 — 신규 가입 신호", () => {
  it("응답 블록 구성은 그대로 유지된다", async () => {
    const me = await getMe(admin("지우"), user(JUST_NOW()));

    expect(Object.keys(me)).toEqual(["profile", "entitlement", "wallet", "equipment"]);
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
