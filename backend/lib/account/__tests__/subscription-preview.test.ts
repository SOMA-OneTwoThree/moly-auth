import { describe, expect, it } from "vitest";
import { deriveEntitlement, effectiveTokenConfig, subscriptionPreviewMode } from "../entitlement";

const id = "preview-fixture";
const now = new Date("2026-09-24T00:00:00Z");
const preview = { accounts: { [id]: "regular" }, expires_at: "2026-09-29T15:00:00Z", campaign_id: "test-campaign" };
const config = (test: unknown = preview, live: unknown = { enabled: false }) => effectiveTokenConfig({
  subscription_launch: live, subscription_launch_test: test,
  free_launch_until: "2099-01-01T00:00:00Z",
});

describe("bounded account preview preserves production rollout", () => {
  it.each(["regular", "legacy_offer"])("only listed %s account qualifies", mode => {
    const c = config({ ...preview, accounts: { [id]: mode } });
    expect(subscriptionPreviewMode(c, id, now)).toBe(mode);
    expect(subscriptionPreviewMode(c, "someone-else", now)).toBeNull();
  });
  it.each([undefined, null, {}, { enabled: "false" }, { enabled: true },
    { enabled: true, existing_user_cutoff: "2099-01-01T00:00:00Z" },
    { enabled: true, existing_user_cutoff: "invalid" },
  ])("requires explicit live=false even with future or invalid T: %j", live => {
    expect(subscriptionPreviewMode(effectiveTokenConfig({ subscription_launch: live, subscription_launch_test: preview }), id, now)).toBeNull();
  });
  it.each([null, "invalid", "infinity", "2026-09-24T00:00:00Z", "2026-02-30T00:00:00Z", "2027-01-01", "2027-01-01T00:00:00+00:00"])("rejects invalid or elapsed UTC deadline: %s", expires_at => {
    expect(subscriptionPreviewMode(config({ ...preview, expires_at }), id, now)).toBeNull();
  });
  it.each([undefined, "", 42, "live-campaign"])("legacy campaign must be separate: %s", campaign_id => {
    expect(subscriptionPreviewMode(config({ ...preview, accounts: { [id]: "legacy_offer" }, campaign_id },
      { enabled: false, campaign_id: "live-campaign" }), id, now)).toBeNull();
  });
  it("preview uses only issued self48 while other accounts keep launch, with paid priority", () => {
    const p = { id, language: "ko", trial_ends_at: "2099-01-01T00:00:00Z" };
    const c = config();
    const free = deriveEntitlement(p, null, 20_000, c, now);
    expect([free.plan, free.daily_token_limit, free.personal_diary_eligible, free.ads_removed]).toEqual(["free", 50_000, false, false]);
    const started = { ...p, app_trial_started_at: now.toISOString(), app_trial_ends_at: "2026-09-26T00:00:00Z" };
    const trial = deriveEntitlement(started, null, 20_000, c, now);
    expect([trial.plan, trial.daily_token_limit, trial.tokens_used, trial.subscriber_theme_unlocked]).toEqual(["trial", 400_000, 20_000, true]);
    expect(deriveEntitlement(started, null, 20_000, c, new Date(started.app_trial_ends_at)).plan).toBe("free");
    expect(deriveEntitlement(started, { plan: "monthly" }, 20_000, c, now).is_subscriber).toBe(true);
    expect(deriveEntitlement({ ...p, id: "other" }, null, 20_000, c, now).entitlement_source).toBe("launch");
    const endedPreview = config({ ...preview, expires_at: now.toISOString() });
    expect(deriveEntitlement(started, null, 20_000, endedPreview, now).entitlement_source).toBe("launch");
  });
});
