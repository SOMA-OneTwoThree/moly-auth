import { describe, expect, it } from "vitest";
import { deriveEntitlement, effectiveTokenConfig, subscriptionPolicyActive } from "../entitlement";

const cutoff = "2026-10-01T00:00:00Z";
const t = Date.parse(cutoff);
const config = effectiveTokenConfig({
  subscription_launch: { enabled: true, existing_user_cutoff: cutoff },
  free_launch_until: "2026-11-01T00:00:00Z", free_launch_token_limit: 150_000,
  daily_token_limit: { free: 20_000, trial: 100_000, subscriber: 100_000 },
});
const profile = { trial_ends_at: null };

describe("subscription policy matches backend boundaries", () => {
  it.each([false, true])("prepared policy holds launch past its old deadline (scheduled=%s)", (scheduled) => {
    const cfg = effectiveTokenConfig({ subscription_launch: { enabled: scheduled, existing_user_cutoff: cutoff },
      free_launch_until: "2026-09-01T00:00:00Z" });
    for (const prior of [false, true]) {
      const p = { ...profile, language: "ja", ...(prior ? {
        app_trial_started_at: "2026-08-01T00:00:00Z", app_trial_ends_at: "2026-08-03T00:00:00Z",
      } : {}) };
      const e = deriveEntitlement(p, null, 12_000, cfg, new Date(t - 1));
      expect(e.entitlement_source).toBe("launch");
      expect(e.daily_token_limit).toBe(150_000);
      expect(e.tokens_remaining).toBe(138_000);
      expect(e.personal_diary_eligible).toBe(true);
      expect(e.trial_ends_at).toBe(scheduled ? cutoff : null);
    }
  });
  it.each([
    ["en", 40_000, 300_000], ["ko", 50_000, 400_000], ["ja", 60_000, 550_000],
    ["ko-KR", 50_000, 400_000], ["ja-JP", 60_000, 550_000],
    ["EN-us", 40_000, 300_000], [null, 40_000, 300_000], ["zh", 40_000, 300_000],
  ] as const)("uses persisted %s language across free, trial and paid plans", (language, free, paid) => {
    const p = { ...profile, language };
    const now = new Date(t);
    const results = [
      deriveEntitlement(p, null, 25_000, config, now),
      deriveEntitlement({ ...p, trial_ends_at: new Date(t + 48 * 3600_000).toISOString() }, null, 25_000, config, now),
      deriveEntitlement({ ...p, app_trial_started_at: cutoff, app_trial_ends_at: new Date(t + 48 * 3600_000).toISOString() }, null, 25_000, config, now),
      deriveEntitlement(p, { plan: "monthly" }, 25_000, config, now),
      deriveEntitlement(p, { plan: "yearly" }, 25_000, config, now),
      deriveEntitlement(p, { plan: "monthly", store_trial_ends_at: "2026-11-01T00:00:00Z" }, 25_000, config, now),
    ];
    expect(results.map(e => e.daily_token_limit)).toEqual([free, paid, paid, paid, paid, paid]);
    expect(results.map(e => e.tokens_remaining)).toEqual([free, paid, paid, paid, paid, paid].map(n => n - 25_000));
    expect(results.every(e => e.tokens_used === 25_000)).toBe(true);
    expect(deriveEntitlement(p, null, 90_000, config, new Date(t - 1)).daily_token_limit).toBe(150_000);
  });
  it("switching languages or losing subscription never resets usage", () => {
    const remaining = ["en", "ja", "ko", "en"].map(language =>
      deriveEntitlement({ ...profile, language }, null, 45_000, config, new Date(t)).tokens_remaining);
    expect(remaining).toEqual([0, 15_000, 5_000, 0]);
    expect(deriveEntitlement({ ...profile, language: "ja" }, { plan: "monthly" }, 70_000, config, new Date(t)).tokens_remaining).toBe(480_000);
    expect(deriveEntitlement({ ...profile, language: "ja" }, null, 70_000, config, new Date(t)).tokens_remaining).toBe(0);
  });
  it("switches globally at T without resetting usage or requiring a paywall dismissal", () => {
    const before = deriveEntitlement(profile, null, 120_000, config, new Date(t - 1));
    const after = deriveEntitlement(profile, null, 120_000, config, new Date(t));
    expect(before.daily_token_limit).toBe(150_000);
    expect(before.entitlement_source).toBe("launch");
    expect(after.daily_token_limit).toBe(40_000);
    expect(after.entitlement_source).toBe("free");
    expect(after.personal_diary_eligible).toBe(false);
    expect(before.tokens_used).toBe(after.tokens_used);
    expect(after.tokens_remaining).toBe(0);
  });
  it.each([-1, 0, 1])("cohort cutoff offset %s ms", (offset) => {
    const p = { trial_ends_at: new Date(t + 48 * 3600_000 + offset).toISOString() };
    const e = deriveEntitlement(p, null, 50_000, config, new Date(t + 3600_000));
    expect(e.daily_token_limit).toBe(offset < 0 ? 40_000 : 300_000);
  });
  it.each([-1, 0, 1])("48-hour expiry offset %s ms", (offset) => {
    const p = { trial_ends_at: new Date(t + 48 * 3600_000).toISOString() };
    const e = deriveEntitlement(p, null, 20_000, config, new Date(t + 48 * 3600_000 + offset));
    expect(e.plan).toBe(offset < 0 ? "trial" : "free");
    expect(e.tokens_used).toBe(20_000);
  });
  it.each(["monthly", "yearly"] as const)("%s paid and store trial share 300k with separate sources", (plan) => {
    for (const trial of [false, true]) {
      const e = deriveEntitlement(profile, { plan, store_trial_ends_at: trial ? "2026-11-01T00:00:00Z" : null },
        80_000, config, new Date(t));
      expect(e.daily_token_limit).toBe(300_000);
      expect(e.tokens_remaining).toBe(220_000);
      expect(e.entitlement_source).toBe(trial ? "store_trial" : "subscription");
      expect(e.personal_diary_eligible).toBe(true);
    }
  });
  it.each([null, {}, { enabled: false, existing_user_cutoff: cutoff },
    { enabled: true, existing_user_cutoff: "invalid" },
    { enabled: true, existing_user_cutoff: "2026-09-01T00:00:00" },
  ])("invalid/disabled setting keeps old policy: %j", (rollout) => {
    const cfg = effectiveTokenConfig({ subscription_launch: rollout, free_launch_until: "2026-11-01T00:00:00Z" });
    expect(subscriptionPolicyActive(cfg, new Date(t))).toBe(false);
    expect(deriveEntitlement(profile, null, 0, cfg, new Date(t)).daily_token_limit).toBe(150_000);
  });
});
