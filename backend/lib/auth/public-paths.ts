/**
 * 공개 경로 허용목록의 단일 출처. 헬스체크만 공개 — 나머지 전부 Bearer 보호.
 * 미들웨어 게이트가 공유한다(목록 표류 방지).
 */
export const PUBLIC_PREFIXES = ["/health"] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}
