/**
 * 신규 가입 판정 — 분석 이벤트(`signup_completed`)의 서버 권위 신호.
 *
 * 클라이언트는 소셜 로그인 결과만으로 신규 가입을 알 수 없다. Supabase는 가입 시
 * `auth.users`를 INSERT한 뒤 refresh token 발급 과정에서 `last_sign_in_at`을 별도
 * UPDATE로 찍어, 두 타임스탬프가 마이크로초 단위로 어긋난다(동등 비교 불가).
 *
 * 판정 재료는 절대 변하지 않는 `auth.users.created_at`과 온보딩 여부 둘뿐이다.
 * 온보딩을 마치면(닉네임 존재) 즉시 false가 되므로, 재설치 후 재로그인한 기존
 * 사용자에게는 절대 true가 나오지 않는다. 창(24h)은 온보딩 미완료 상태로 오래
 * 방치된 계정이 뒤늦게 가입 코호트에 잘못 들어가는 것을 막는다.
 */
export const SIGNUP_WINDOW_MS = 24 * 60 * 60 * 1000;

export function isNewSignup(
  nickname: string | null,
  userCreatedAt: string,
  now: Date,
): boolean {
  if (nickname !== null) return false;
  const createdAt = Date.parse(userCreatedAt);
  if (Number.isNaN(createdAt)) return false;
  return now.getTime() - createdAt <= SIGNUP_WINDOW_MS;
}
