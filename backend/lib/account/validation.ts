/**
 * 계정 요청 필드 검증 — moly-backend(app/schemas/account.py)와 동일 규칙.
 * 닉네임 ≤10자(API_SPEC 2장, DB CHECK와 동기) — 위반 시 422 VALIDATION.
 */

/** ISO 639-1(+선택 지역). 문자·하이픈만 — LLM 시스템 프롬프트에 삽입되므로 주입 문자 차단. */
const LANGUAGE_RE = /^[a-zA-Z]{2}(-[a-zA-Z]{2,4})?$/;

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

export function isValidLanguage(v: unknown): v is string {
  return typeof v === "string" && v.length <= 8 && LANGUAGE_RE.test(v);
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
