import type { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createSupabaseTokenClient } from "@/lib/supabase/token";

/**
 * `Authorization: Bearer <token>`에서 인증된 유저를 확정한다.
 * 모든 클라이언트(iOS·web)가 Supabase access token을 이 형태로 보낸다.
 *
 * `getUser(token)`은 항상 Supabase Auth 서버에 검증한다 — JWT를 로컬에서
 * 신뢰하지 않는다. 헤더 없음/무효 토큰이면 null.
 *
 * 익명(is_anonymous) 토큰은 거부한다 — 제품은 소셜 로그인 전용이고,
 * 익명 유저는 profiles 대상이 아니다(moly-backend allow_anonymous_auth=False와 동일 정책).
 */
export async function requireUser(req: NextRequest): Promise<User | null> {
  const authz = req.headers.get("authorization");
  if (!authz?.startsWith("Bearer ")) return null;

  const token = authz.slice("Bearer ".length).trim();
  if (!token) return null;

  const supabase = createSupabaseTokenClient(token);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  if (data.user.is_anonymous) return null;

  return data.user;
}
