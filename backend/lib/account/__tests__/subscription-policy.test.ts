import { describe, expect, it } from "vitest";
import { deriveEntitlement, effectiveTokenConfig } from "../entitlement";

// free_launch_until is the store release moment T.
const cutoff = "2026-10-01T00:00:00Z";
const t = Date.parse(cutoff);
const config = effectiveTokenConfig({
  free_launch_until: cutoff, free_launch_token_limit: 150_000,
  daily_token_limit: { free: 20_000, trial: 100_000, subscriber: 100_000 },
});
const profile = { trial_ends_at: null };

describe("subscription policy matches backend boundaries", () => {
  it("before release, only an app trial started on the new app leaves launch", () => {
    const before = new Date(t - 1);
    const launch = deriveEntitlement({ ...profile, language: "ja" }, null, 12_000, config, before);
    expect(launch.entitlement_source).toBe("launch");
    expect(launch.daily_token_limit).toBe(150_000);
    expect(launch.personal_diary_eligible).toBe(true);
    expect(launch.trial_ends_at).toBe(cutoff);
    const trialEnd = new Date(t + 3600_000).toISOString();
    const trial = { ...profile, language: "ja", app_trial_started_at: "2026-09-29T00:00:00Z", app_trial_ends_at: trialEnd };
    expect(deriveEntitlement(trial, null, 12_000, config, before).entitlement_source).toBe("signup_trial");
    expect(deriveEntitlement(trial, null, 12_000, config, before).daily_token_limit).toBe(550_000);
    expect(deriveEntitlement(trial, null, 12_000, config, new Date(trialEnd)).entitlement_source).toBe("free");
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
  it.each([null, "invalid"])("missing or invalid release time ends launch (fail-safe): %s", (value) => {
    const cfg = effectiveTokenConfig({ free_launch_until: value });
    expect(deriveEntitlement(profile, null, 0, cfg, new Date(t)).entitlement_source).toBe("free");
  });
});
