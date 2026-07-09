import { NextResponse, type NextRequest } from "next/server";
import { applyCors } from "@/lib/cors";
import { isPublicPath } from "@/lib/auth/public-paths";
import { unauthorized } from "@/lib/http/responses";

/**
 * 모든 API 요청에서 실행:
 *  1. CORS 프리플라이트(OPTIONS) + 모든 응답에 CORS 헤더(단일 적용 지점).
 *  2. 조기 차단 게이트: 비공개 경로는 Bearer 헤더가 있어야 통과.
 *
 * 게이트는 네트워크 없는 빠른 거절일 뿐 보안 경계가 아니다 — 가짜 토큰도 여기는
 * 통과하고, 핸들러의 `withAuth`/`requireUser`(getUser 권위 검증)가 최종 거절한다.
 *
 * 경로는 API_SPEC과 동일하게 /api 프리픽스 없이 노출한다(iOS가 /me, /onboarding
 * 형태로 호출). 새 라우트를 추가하면 아래 matcher에도 추가할 것.
 */
export function middleware(req: NextRequest) {
  if (req.method === "OPTIONS") {
    return applyCors(req, new NextResponse(null, { status: 204 }));
  }

  if (isPublicPath(req.nextUrl.pathname)) {
    return applyCors(req, NextResponse.next());
  }

  const hasBearer = req.headers.get("authorization")?.startsWith("Bearer ");
  if (!hasBearer) {
    return applyCors(req, unauthorized());
  }

  return applyCors(req, NextResponse.next());
}

export const config = {
  matcher: ["/health", "/me/:path*", "/me", "/onboarding", "/auth/:path*"],
};
