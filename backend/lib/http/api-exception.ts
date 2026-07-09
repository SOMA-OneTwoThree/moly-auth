import type { NextRequest, NextResponse } from "next/server";
import { apiError, internalError } from "./responses";

/**
 * 서비스 계층이 던지는 의도된 비즈니스 에러(API_SPEC 부록 B 코드).
 * 라우트의 `handle()` 래퍼가 잡아 표준 봉투로 직렬화한다.
 */
export class ApiException extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

/**
 * 라우트 공통 에러 경계 — ApiException은 그 형태로, 나머지는 원인을 서버 로그에만
 * 남기고 일반화된 500으로 마스킹한다(내부 메시지 비노출).
 * 가변 인자 — withAuth가 넘기는 (req, user) 시그니처를 그대로 통과시킨다.
 */
export function handle<A extends unknown[]>(
  handler: (req: NextRequest, ...args: A) => Promise<NextResponse> | NextResponse,
): (req: NextRequest, ...args: A) => Promise<NextResponse> {
  return async (req, ...args) => {
    try {
      return await handler(req, ...args);
    } catch (e) {
      if (e instanceof ApiException) {
        return apiError(e.code, e.status, e.message, e.details);
      }
      console.error("[internal]", e);
      return internalError();
    }
  };
}
