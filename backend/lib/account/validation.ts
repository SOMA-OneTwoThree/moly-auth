/**
 * 계정 요청 필드 검증 — moly-backend(app/schemas/account.py)와 동일 규칙.
 * 닉네임 ≤10자(API_SPEC 2장, DB CHECK와 동기) — 위반 시 422 VALIDATION.
 */

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

/**
 * BCP 47 언어 태그 검증 + 정규화 — 유효하면 canonical(대소문자 정규화) 태그, 아니면 null.
 * ko·en·en-US·zh-Hant-TW·es-419·kok 등 표준 태그 허용. Intl.getCanonicalLocales가 구조 검증까지
 * 하므로 빈값·공백·구분자·제어문자·문장은 throw→null. 출력은 canonical BCP 47([a-zA-Z0-9-])이라
 * LLM 시스템 프롬프트에 삽입해도 주입 안전. 저장은 정규화된 값으로(온보딩·프로필 변경 동일 결과).
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
