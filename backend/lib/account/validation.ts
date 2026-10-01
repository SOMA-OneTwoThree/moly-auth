/**
 * 계정 요청 필드 검증 — moly-backend(app/schemas/account.py)와 동일 규칙.
 * 닉네임 ≤10자(API_SPEC 2장, DB CHECK와 동기) — 위반 시 422 VALIDATION.
 */

import { LEGACY_TIMEZONE_ALIASES } from "./timezone-aliases";

/** 제어·서식 문자(개행 포함) — 닉네임도 LLM 프롬프트에 삽입되므로 차단. */
const CONTROL_CHARS_RE = /[\p{Cc}\p{Cf}]/u;

export function isValidNickname(v: unknown): v is string {
  return (
    typeof v === "string" &&
    v.length >= 1 &&
    v.length <= 10 &&
    !CONTROL_CHARS_RE.test(v)
  );
}

/** 지원 푸시 플랫폼 — DB user_devices.platform CHECK와 동기(moly-backend). */
export const ALLOWED_PLATFORMS = ["ios", "android"] as const;

/** 푸시 토큰 플랫폼 검증. 생략 시 ios 폴백은 호출측이 처리. */
export function isValidPlatform(v: unknown): v is (typeof ALLOWED_PLATFORMS)[number] {
  return typeof v === "string" && (ALLOWED_PLATFORMS as readonly string[]).includes(v);
}

/**
 * BCP 47 언어 태그 검증 + 정규화 — 유효하면 canonical(대소문자 정규화) 태그, 아니면 null.
 * ko·en·en-US·zh-Hant-TW·es-419·kok 등 표준 태그 허용. Intl.getCanonicalLocales가 구조 검증까지
 * 하므로 빈값·공백·구분자·제어문자·문장은 throw→null. 출력은 canonical BCP 47([a-zA-Z0-9-])이라
 * LLM 시스템 프롬프트에 삽입해도 주입 안전. 저장은 정규화된 값으로(온보딩·프로필 변경 동일 결과).
 * 참고: moly-backend i18n.resolve()가 이 값을 base 언어로 콘텐츠 분기(ko-KR→ko, SOMA-346).
 */
export function normalizeLanguage(v: unknown): string | null {
  if (typeof v !== "string" || v.length === 0 || v.length > 35) return null;
  try {
    const canonical = Intl.getCanonicalLocales(v);
    return canonical.length === 1 ? canonical[0] : null;
  } catch {
    return null;
  }
}

export function isValidLanguage(v: unknown): v is string {
  return normalizeLanguage(v) !== null;
}

/** IANA 타임존 검증 — Intl이 모르는 이름이면 throw → false. */
export function isValidTimezone(v: unknown): v is string {
  if (typeof v !== "string" || v.length === 0) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: v });
    return true;
  } catch {
    return false;
  }
}

/**
 * 저장용 타임존 정규화 — 유효하면 현행 IANA 식별자, 아니면 null.
 * 기기(Android `ZoneId.systemDefault()`, iOS `TimeZone.current`)는 Asia/Calcutta·US/Eastern 같은
 * 레거시 별칭을 그대로 준다. Intl은 받아들이지만 moly-backend 컨테이너(Debian trixie, tzdata-legacy
 * 없음)는 못 풀어 워커 스킵·422·KST 폴백이 났다(2026-10-01, 41명). 거부하면 그 기기는 온보딩 자체가
 * 막히므로 **거부가 아니라 정규화**한다. Intl.resolvedOptions()/supportedValuesOf로 정규화하면 안 된다 —
 * ICU 78(Node 24/25)은 Asia/Kolkata를 'Asia/Calcutta'로 되돌린다. 정적 표(tzdata backward)만 쓴다.
 */
export function normalizeTimezone(v: unknown): string | null {
  if (!isValidTimezone(v)) return null;
  return Object.prototype.hasOwnProperty.call(LEGACY_TIMEZONE_ALIASES, v)
    ? LEGACY_TIMEZONE_ALIASES[v]
    : v;
}
