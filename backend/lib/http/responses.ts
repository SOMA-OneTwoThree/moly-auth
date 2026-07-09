import { NextResponse } from "next/server";

/**
 * API_SPEC 1장 공통 에러 봉투: { error: { code, message, details } }
 * moly-backend(app/core/errors.py)와 동일 형식 — iOS가 이 형태를 파싱한다.
 */
export function apiError(
  code: string,
  status: number,
  message: string,
  details: Record<string, unknown> = {},
) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

export function unauthorized() {
  return apiError("UNAUTHORIZED", 401, "로그인이 필요해요.");
}

export function validationError(
  message: string,
  details: Record<string, unknown> = {},
) {
  return apiError("VALIDATION", 422, message, details);
}

/**
 * 내부(DB/admin) 에러용 500. 원인 메시지(제약명·스키마·PG 코드 등)를 클라이언트에
 * 노출하지 않는다 — 원인은 호출부에서 `console.error`로 서버 로그에만 남긴다.
 */
export function internalError() {
  return apiError(
    "INTERNAL",
    500,
    "일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
  );
}
