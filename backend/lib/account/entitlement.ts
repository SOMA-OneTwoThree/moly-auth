/**
 * 티어(entitlement) 판정 — ERD §6.1. 컬럼 저장 아님, 조회 시 판정.
 * moly-backend(app/services/entitlement.py·limits.py)의 포팅 — 순수 함수.
 *
 * ⚠️ 동기화 규칙: 판정 공식(ERD §6.1)과 아래 임의 기본값(TBD)은 moly-backend와
 * 이중화돼 있다. 정책 확정 시 DB `app_config`에 값을 넣으면 두 서버가 같은 값을
 * 읽으므로, 기본값 하드코딩 불일치가 무해해진다(app_config이 항상 우선).
 */

export type ProfileRow = {
  id: string;
  nickname: string | null;
  language: string;
  timezone: string;
  hay_balance: number;
  trial_ends_at: string | null;
  review_prompted_at: string | null;
};

export type ActiveSubscription = {
  plan: "monthly" | "yearly";
};

export type TokenConfig = {
  daily_token_limit: { free?: number; trial?: number; subscriber?: number };
  diary_llm_min_tokens: number | null;
};

/** app_config 미설정 시 임의 기본값(TBD) — moly-backend app/config.py와 동일 값. */
export const DEFAULT_TOKEN_CONFIG: TokenConfig = {
  daily_token_limit: { free: 20_000, trial: 100_000, subscriber: 100_000 },
  diary_llm_min_tokens: 2_000,
};

/** app_config rows(key→value)에서 유효 설정 해석 — 값이 있으면 우선, 없으면 기본값. */
export function effectiveTokenConfig(
  configValues: Record<string, unknown>,
): TokenConfig {
  const limits = configValues["daily_token_limit"];
  const diary = configValues["diary_llm_min_tokens"];
  return {
    daily_token_limit:
      limits !== null && typeof limits === "object" && !Array.isArray(limits)
        ? (limits as TokenConfig["daily_token_limit"])
        : DEFAULT_TOKEN_CONFIG.daily_token_limit,
    diary_llm_min_tokens:
      typeof diary === "number"
        ? diary
        : DEFAULT_TOKEN_CONFIG.diary_llm_min_tokens,
  };
}

function limitFor(plan: string, limits: TokenConfig["daily_token_limit"]): number | null {
  let v: number | undefined;
  if (plan === "free") v = limits.free;
  else if (plan === "trial") v = limits.trial ?? limits.subscriber;
  else v = limits.subscriber; // monthly | yearly
  return typeof v === "number" ? v : null;
}

export type Entitlement = {
  plan: "trial" | "free" | "monthly" | "yearly";
  is_subscriber: boolean;
  trial_ends_at: string | null;
  ads_removed: boolean;
  subscriber_theme_unlocked: boolean;
  daily_token_limit: number | null;
  tokens_used: number;
  tokens_remaining: number | null;
  personal_diary_token_threshold: number | null;
};

/**
 * entitlement 블록 생성(API_SPEC 2장 GET /me).
 * activeSub은 '유효한(active/grace_period + 미만료)' 구독만 넘어옴(없으면 null).
 */
export function deriveEntitlement(
  profile: Pick<ProfileRow, "trial_ends_at">,
  activeSub: ActiveSubscription | null,
  tokensUsed: number,
  config: TokenConfig,
  now: Date,
): Entitlement {
  let plan: Entitlement["plan"];
  let isSubscriber: boolean;
  let trialEndsAt: string | null;
  let subscriberThemeUnlocked: boolean;

  if (activeSub !== null) {
    plan = activeSub.plan;
    isSubscriber = true;
    trialEndsAt = null;
    subscriberThemeUnlocked = true;
  } else if (
    profile.trial_ends_at !== null &&
    now < new Date(profile.trial_ends_at)
  ) {
    plan = "trial";
    isSubscriber = false;
    trialEndsAt = profile.trial_ends_at;
    subscriberThemeUnlocked = false;
  } else {
    plan = "free";
    isSubscriber = false;
    trialEndsAt = null;
    subscriberThemeUnlocked = false;
  }

  const limit = limitFor(plan, config.daily_token_limit);
  const tokensRemaining = limit !== null ? Math.max(0, limit - tokensUsed) : null;

  return {
    plan,
    is_subscriber: isSubscriber,
    trial_ends_at: trialEndsAt,
    ads_removed: plan !== "free", // free만 배너 노출
    subscriber_theme_unlocked: subscriberThemeUnlocked, // 구독만(체험 제외)
    daily_token_limit: limit,
    tokens_used: tokensUsed,
    tokens_remaining: tokensRemaining,
    personal_diary_token_threshold: config.diary_llm_min_tokens,
  };
}
