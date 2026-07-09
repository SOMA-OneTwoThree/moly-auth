import { describe, expect, it } from "vitest";
import {
  DEFAULT_TOKEN_CONFIG,
  deriveEntitlement,
  effectiveTokenConfig,
} from "../entitlement";

const NOW = new Date("2026-07-09T12:00:00Z");
// 티어 판정 테스트는 런칭 무료 OFF 기준(런칭은 아래 별도 describe에서 검증).
const CONFIG = { ...DEFAULT_TOKEN_CONFIG, free_launch_until: null };

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
      { ...c, free_launch_until: null }, // 런칭 OFF로 trial 한도 폴백만 검증
      NOW,
    );
    expect(e.daily_token_limit).toBe(99);
  });
});

describe("런칭 무료 기간 — free_launch_until 스위치", () => {
  const LAUNCH = {
    ...DEFAULT_TOKEN_CONFIG,
    free_launch_until: "2026-09-01T04:00:00+09:00",
    free_launch_token_limit: 50_000,
  };

  it("종료일 이전 + 구독/체험 없음 = 런칭 무료(구독급 표시 + 런칭 한도)", () => {
    const e = deriveEntitlement({ trial_ends_at: null }, null, 10_000, LAUNCH, NOW);
    expect(e.plan).toBe("trial");
    expect(e.is_subscriber).toBe(false);
    expect(e.daily_token_limit).toBe(50_000); // 런칭 한도(trial 100k 아님)
    expect(e.tokens_remaining).toBe(40_000);
    expect(e.trial_ends_at).toBe("2026-09-01T04:00:00+09:00");
  });

  it("런칭 중이어도 실제 구독자는 subscriber 우선", () => {
    const e = deriveEntitlement({ trial_ends_at: null }, { plan: "monthly" }, 0, LAUNCH, NOW);
    expect(e.plan).toBe("monthly");
    expect(e.is_subscriber).toBe(true);
    expect(e.daily_token_limit).toBe(DEFAULT_TOKEN_CONFIG.daily_token_limit.subscriber);
  });

  it("종료일 지나면 정상 등급으로 복귀", () => {
    const after = new Date("2026-09-02T00:00:00Z");
    const e = deriveEntitlement({ trial_ends_at: null }, null, 500, LAUNCH, after);
    expect(e.plan).toBe("free");
    expect(e.daily_token_limit).toBe(DEFAULT_TOKEN_CONFIG.daily_token_limit.free);
  });

  it("잘못된 날짜 = OFF(정상 등급, fail-safe)", () => {
    const bad = { ...LAUNCH, free_launch_until: "not-a-date" };
    const e = deriveEntitlement({ trial_ends_at: null }, null, 500, bad, NOW);
    expect(e.plan).toBe("free");
    expect(e.daily_token_limit).toBe(DEFAULT_TOKEN_CONFIG.daily_token_limit.free);
  });
});
