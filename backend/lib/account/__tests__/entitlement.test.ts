import { describe, expect, it } from "vitest";
import {
  DEFAULT_TOKEN_CONFIG,
  deriveEntitlement,
  effectiveTokenConfig,
} from "../entitlement";

const NOW = new Date("2026-07-09T12:00:00Z");
const CONFIG = DEFAULT_TOKEN_CONFIG;

describe("deriveEntitlement — ERD §6.1 티어 판정", () => {
  it("유효 구독이 있으면 구독 플랜(체험 기간 남아 있어도 구독 우선)", () => {
    const e = deriveEntitlement(
      { trial_ends_at: "2026-07-10T00:00:00Z" },
      { plan: "monthly" },
      100,
      CONFIG,
      NOW,
    );
    expect(e.plan).toBe("monthly");
    expect(e.is_subscriber).toBe(true);
    expect(e.trial_ends_at).toBeNull();
    expect(e.ads_removed).toBe(true);
    expect(e.subscriber_theme_unlocked).toBe(true);
  });

  it("구독 없음 + trial_ends_at 미래 = trial (구독 전용 테마는 잠금)", () => {
    const e = deriveEntitlement(
      { trial_ends_at: "2026-07-10T00:00:00Z" },
      null,
      0,
      CONFIG,
      NOW,
    );
    expect(e.plan).toBe("trial");
    expect(e.is_subscriber).toBe(false);
    expect(e.trial_ends_at).toBe("2026-07-10T00:00:00Z");
    expect(e.ads_removed).toBe(true);
    expect(e.subscriber_theme_unlocked).toBe(false);
    expect(e.daily_token_limit).toBe(CONFIG.daily_token_limit.trial);
  });

  it("구독 없음 + 체험 만료 = free", () => {
    const e = deriveEntitlement(
      { trial_ends_at: "2026-07-09T00:00:00Z" },
      null,
      500,
      CONFIG,
      NOW,
    );
    expect(e.plan).toBe("free");
    expect(e.ads_removed).toBe(true); // 배너 광고 미출시 — 전 등급 항상 true(2026-07-09)
    expect(e.daily_token_limit).toBe(CONFIG.daily_token_limit.free);
  });

  it("trial_ends_at null(구 데이터) = free", () => {
    const e = deriveEntitlement({ trial_ends_at: null }, null, 0, CONFIG, NOW);
    expect(e.plan).toBe("free");
  });

  it("tokens_remaining은 0으로 클램프(음수 노출 금지 — API_SPEC 1장)", () => {
    const e = deriveEntitlement(
      { trial_ends_at: null },
      null,
      (CONFIG.daily_token_limit.free ?? 0) + 999,
      CONFIG,
      NOW,
    );
    expect(e.tokens_remaining).toBe(0);
    expect(e.tokens_used).toBe((CONFIG.daily_token_limit.free ?? 0) + 999);
  });
});

describe("effectiveTokenConfig — app_config 우선, 없으면 기본값", () => {
  it("app_config 값이 있으면 그 값을 쓴다", () => {
    const c = effectiveTokenConfig({
      daily_token_limit: { free: 1, trial: 2, subscriber: 3 },
      diary_llm_min_tokens: 42,
    });
    expect(c.daily_token_limit.free).toBe(1);
    expect(c.diary_llm_min_tokens).toBe(42);
  });

  it("없거나 형식이 다르면 기본값으로 폴백", () => {
    const c = effectiveTokenConfig({ daily_token_limit: "broken" });
    expect(c.daily_token_limit).toEqual(DEFAULT_TOKEN_CONFIG.daily_token_limit);
    expect(c.diary_llm_min_tokens).toBe(DEFAULT_TOKEN_CONFIG.diary_llm_min_tokens);
  });

  it("trial 한도 미지정 시 subscriber 한도로 폴백(ERD §6.1)", () => {
    const c = effectiveTokenConfig({
      daily_token_limit: { free: 10, subscriber: 99 },
    });
    const e = deriveEntitlement(
      { trial_ends_at: "2099-01-01T00:00:00Z" },
      null,
      0,
      c,
      NOW,
    );
    expect(e.daily_token_limit).toBe(99);
  });
});
