# Backend 아키텍처 — Moly 계정(auth) 서버

Moly의 **계정 서버**. 로그인 검증·회원가입 확정(profiles)·프로필·알림 설정·푸시 토큰·로그아웃·회원탈퇴를 담당하는 순수 API 서버다. UI 없음.

> **역할 경계 (2026-07-09 확정)** — 계정 API는 이 서버가, 나머지 도메인 API(대화·일기·경제·상점·루틴·구독·워커)는 `moly-backend`(FastAPI, EC2 `https://voice.moly.asia`)가 서빙한다. iOS는 base URL 2개를 사용한다.
> **현재 API 계약의 기준**은 `app/**/route.ts`, `lib/account`와 `lib/http`의 실제 구현이다. 공유 DB의 canonical DDL은 `moly-backend/db/`가 소유한다.

---

## 1. 인증 모델

- **로그인(토큰 발급)은 서버가 하지 않는다.** iOS가 Supabase SDK로 소셜 로그인(Apple/Kakao/Google)을 수행하고, 서버는 `Authorization: Bearer <Supabase access token>`을 **검증만** 한다. Bearer 전용 — 쿠키 세션 없음.
- 검증 = `supabase.auth.getUser(token)` (항상 Supabase Auth 서버에 확인 — JWT 로컬 신뢰 없음). **익명(is_anonymous) 토큰은 거부**(제품은 소셜 전용).
- canonical 유저 식별자 = `auth.users.id`(JWT `sub`, uuid). 모든 DB 작업은 이 값으로만 스코프.

### 회원가입 → profiles (auth.users → public.profiles)

1. **주 경로: DB 트리거** — `on_auth_user_created`(`handle_new_user`, 원본: `moly-backend/db/seed_and_triggers.sql`)가 가입 시 `profiles(id, trial_ends_at=가입+48h)`를 자동 생성. 프로덕션 DB 적용 확인됨(2026-07-09).
2. **보조 경로: self-heal** — `GET /me`·`POST /onboarding`이 profiles가 없으면 트리거와 같은 규칙으로 생성(`lib/account/service.ts`의 `ensureProfile`, 멱등). 트리거 이전 가입자·트리거 유실에도 계정이 막히지 않는다.
3. `nickname`이 NULL이면 온보딩 미완료 → 클라가 온보딩 화면으로 라우팅. `POST /onboarding`은 1회만(재호출 409 `ALREADY_ONBOARDED`).
4. **신규 가입 신호** — profile 블록의 `is_new_signup`(`lib/account/signup.ts`)은 `auth.users.created_at`이 24시간 이내이고 온보딩 미완료일 때만 true. iOS가 `signup_completed` 분석 이벤트를 보낼 유일한 근거다. 클라이언트는 Supabase 세션의 `created_at`/`last_sign_in_at`을 비교할 수 없다 — 가입 시 두 값이 별도 statement로 기록돼 마이크로초 단위로 어긋난다. 온보딩 완료 시 즉시 false가 되므로 재설치한 기존 사용자에게는 true가 나오지 않는다.

## 2. 요청 수명주기 (2계층)

1. **`middleware.ts`** — OPTIONS 프리플라이트 204, 모든 응답에 CORS(단일 적용 지점), 비공개 경로 Bearer 부재 시 즉시 401. **조기 차단일 뿐 보안 경계 아님.**
2. **`withAuth`** (`lib/auth/with-auth.ts`) — **실제 보안 권위.** `requireUser`(getUser 검증) 통과한 `user`만 핸들러에 전달. 모든 비공개 라우트는 반드시 이걸로 감싼다.
3. **`handle`** (`lib/http/api-exception.ts`) — 공통 에러 경계. `ApiException`은 표준 봉투로, 나머지는 서버 로그에만 남기고 500으로 마스킹(내부 메시지 비노출).

에러 봉투: `{ "error": { "code", "message", "details" } }` — 401 `UNAUTHORIZED` / 422 `VALIDATION` / 409 `ALREADY_ONBOARDED` / 500 `INTERNAL`.

## 3. 데이터 접근 규칙

**모든 DB 작업 = admin(service_role) 클라이언트** (`lib/supabase/admin.ts`) — RLS 우회.
- 이유: 쓰기 정책이 없는 RLS 체계(ERD §8, 클라 직접 쓰기 전면 금지)에서 서버는 service_role이 표준이고, moly-backend도 동일(service_role DSN).
- 🔒 따라서 **모든 쿼리는 반드시 검증된 `user.id`로만 스코프**(`eq("id", user.id)` 등). 외부 입력 id를 넘기면 IDOR — `lib/supabase/admin.ts` 경고 참조.
- 토큰 클라이언트(`lib/supabase/token.ts`)는 `requireUser`의 getUser 검증에만 사용.

**스키마 소유권**: DDL은 `moly-backend/db/schema.sql`이 단일 출처 — **이 레포는 마이그레이션을 갖지 않는다**(구 `supabase/migrations/` 삭제됨). 접근 테이블: `profiles`, `subscriptions`, `user_daily_stats`, `app_config`, `user_items`(장착 조회 시 `products`를 명시적 FK로 embed), `user_notification_settings`, `user_devices`, `memories`(mem0).

## 4. 엔드포인트

| 메서드 | 경로 | 용도 / 주요 응답 |
|---|---|---|
| GET | `/health` | 공개 헬스체크(유일한 무인증) |
| GET | `/me` | 부팅 집계: profile(+`is_new_signup`)·entitlement·wallet·equipment. profiles 없으면 self-heal 생성 |
| POST | `/onboarding` | 닉네임(1~10자)·타임존(IANA)·언어(ISO 639-1) 저장 → `{profile, entitlement}`. 재호출 409 |
| PATCH | `/me` | 보낸 필드만 변경 → `{profile}` |
| GET/PATCH | `/me/notifications` | 알림 2종(morning_diary·evening_chat) on/off. 행 없으면 기본 on |
| POST | `/me/push-token` | FCM 푸시 토큰 upsert(`platform: ios\|android`, 생략 시 ios 하위호환. 토큰 UNIQUE — 기기 이전 시 재귀속) → 204 |
| POST | `/auth/logout` | 해당 push_token 행만 삭제(멀티 기기 안전) → 204. 세션 종료는 클라 signOut |
| DELETE | `/me` | 탈퇴: `auth.admin.deleteUser`(전 테이블 CASCADE) + mem0 행 정리(실패해도 204 — 최종적 정리) → 204 |

경로는 `/api` 프리픽스 없음(iOS가 `/me` 형태로 호출). 새 라우트 추가 시: `withAuth(handle(...))` 래핑 + `middleware.ts` matcher + (공개면) `lib/auth/public-paths.ts` + 이 표 갱신.

## 5. entitlement(티어) 판정 — 이중화 주의

`lib/account/entitlement.ts` = moly-backend `app/services/entitlement.py`의 포팅(ERD §6.1 공식: 유효 구독 > trial(가입+48h) > free). **공식과 기본값이 두 서버에 이중화**돼 있다.

- **동기화 장치 = DB `app_config`**: `daily_token_limit`(jsonb `{free,trial,subscriber}`)·`diary_llm_min_tokens` 행이 있으면 **두 서버 모두 그 값을 우선** 사용 — 하드코딩 기본값은 폴백일 뿐. 정책 수치는 app_config에 넣는 것이 원칙.
- 판정 공식 자체를 바꿀 땐 두 레포를 같이 수정: `entitlement.ts` ↔ `entitlement.py`.

## 6. 기술 스택 / 구조

| 항목 | 값 |
|---|---|
| 프레임워크 | Next.js 15 (App Router, Route Handler 전용) · TypeScript strict |
| SDK | `@supabase/supabase-js` (유일한 비프레임워크 의존성) |
| 테스트 | vitest — 순수 로직(entitlement·activity_date·검증) 단위 테스트. `npm test` |
| 배포 | Vercel — `https://moly-server.vercel.app` |

```
backend/
├── middleware.ts               # CORS + Bearer 조기 차단(보안경계 아님)
├── app/
│   ├── health/route.ts         # 공개
│   ├── me/route.ts             # GET·PATCH·DELETE
│   ├── me/notifications/route.ts
│   ├── me/push-token/route.ts
│   ├── onboarding/route.ts
│   └── auth/logout/route.ts
└── lib/
    ├── auth/                   # public-paths · require-user(getUser+익명거부) · with-auth
    ├── http/                   # responses(에러 봉투) · api-exception(handle) · body(파싱·unknown 필드 거부)
    ├── account/                # validation · time(activity_date) · entitlement · service(DB 접근 전부)
    ├── supabase/               # admin(service_role) · token(anon+Bearer)
    └── cors.ts
```

`lib/account/time.ts`: 앱 기준일 = (유저 로컬 − 4시간)의 날짜(04:00 경계) — moly-backend `time_utils.py`와 동일.

## 7. 환경 변수 (Vercel)

| 키 | 설명 |
|---|---|
| `SUPABASE_URL` | 프로덕션 Supabase 프로젝트 URL (moly-backend와 **같은 프로젝트**여야 함) |
| `SUPABASE_PUBLISHABLE_KEY` | 공개 키(`sb_publishable_…`) — getUser 검증용 토큰 클라이언트 |
| `SUPABASE_SECRET_KEY` | secret key(`sb_secret_…`) — admin 클라이언트. **클라이언트 노출 절대 금지** |

> legacy `SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY`는 2026-08 유출로 폐기(코드에 전환기 폴백만 남음 — Vercel env 교체 후 제거).
| `CORS_ALLOWED_ORIGINS` | 허용 origin(쉼표 구분, 정확한 origin만). 네이티브 앱은 Origin 미전송이라 무관 |

Google OAuth → Authorized redirect URIs에는 Supabase 콜백만: `https://<project-ref>.supabase.co/auth/v1/callback`.

## 8. 런북

- **검증 3종**: `npm run typecheck` · `npm run lint` · `npm test` (+ `npm run build`)
- **탈퇴했는데 mem0 잔존 의심**: Vercel 함수 로그에서 `[mem0 cleanup failed]` 검색 → 해당 user_id의 `memories` 행을 SQL로 수동 정리
- **모든 계정 요청 401**: Vercel env의 `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY`가 프로덕션 프로젝트인지 확인
- **profiles 안 생김 의심**: 트리거 확인 쿼리(`pg_trigger`에서 `on_auth_user_created`) — 없어도 self-heal이 커버하지만 트리거 복구 필요(`moly-backend/db/seed_and_triggers.sql` §1)

## 개발 계정 API

개발 Supabase의 기존 Apple·Google·카카오 인증 설정을 재사용한다. LINE은 개발 프로젝트에 미등록이다.

| 대상 | Vercel 프로젝트 | 배포 브랜치 | API | Supabase |
|---|---|---|---|---|
| 개발 | moly-server-dev | dev | https://moly-server-dev.vercel.app | wywzjslvxwttxkecbyis |
| 운영 | moly-server | main | https://moly-server.vercel.app | qkgjlgzsharnilxnkytd |

각 프로젝트의 SUPABASE_URL·SUPABASE_PUBLISHABLE_KEY·SUPABASE_SECRET_KEY는 같은 환경의 Supabase를 가리킨다.
서버 비밀 키는 Vercel 환경 변수에만 보관한다. 개발 프로젝트는 운영 키를 상속하지 않는다.
Vercel에서 개발 프로젝트의 Production은 위 개발 API 고정 주소의 배포 슬롯을 뜻하며 운영 DB를 의미하지 않는다.
Preview는 Vercel 인증 보호를 유지한다. 앱은 고정 API 주소를 사용하고 /me 등은 기존 Supabase 사용자 인증을 요구한다.
/health 200 및 무인증 /me 401을 배포 후 확인한다. 실제 로그인·온보딩·재실행·탈퇴 검수는 개발 앱에서 수행한다.
