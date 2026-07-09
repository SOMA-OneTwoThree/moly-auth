import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { requireUser } from "./require-user";
import { internalError, unauthorized } from "@/lib/http/responses";

type AuthedHandler = (
  req: NextRequest,
  user: User,
) => Promise<NextResponse> | NextResponse;

/**
 * 보호 라우트 래퍼 — 이 함수가 라우트의 보안 권위(security authority)다.
 * `requireUser`(getUser 권위 검증)를 통과한 검증된 `user`만 핸들러에 넘긴다.
 *
 * 미들웨어의 Bearer 게이트는 네트워크 없는 조기 차단일 뿐 보안 경계가 아니다 —
 * 모든 비공개 라우트는 반드시 withAuth로 감싼다. CORS는 미들웨어가 중앙 적용.
 */
export function withAuth(handler: AuthedHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    let user: User | null;
    try {
      user = await requireUser(req);
    } catch (e) {
      // getUser가 throw하는 경우(Auth 일시 장애 등)에도 표준 에러 봉투 유지
      // — 무효 토큰(401)과 구분해 500으로 응답한다.
      console.error("[auth verify failed]", e);
      return internalError();
    }
    if (!user) return unauthorized();
    return handler(req, user);
  };
}
