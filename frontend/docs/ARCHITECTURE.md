# Frontend 아키텍처

인증 체인 확인용 **최소 앱** + 앱 출시에 필요한 **공개 페이지**(개인정보 처리방침·고객 지원·계정 삭제 요청)를 한 Next.js 앱에 둔다. 백엔드(`moly-server/backend`)와 짝을 이룬다.

> 이 문서가 frontend 구조의 **단일 출처**다. 라우트·env·스타일 토큰의 상세는 항상 여기에 기록하고, 루트 `README.md`는 요약 + 링크만 둔다.
>
> **문서 갱신 규칙**: 라우트 추가 → [라우트](#3-라우트) 표 갱신 / env 추가 → [환경 변수](#8-환경-변수) 표 갱신 / 새 공개 페이지 → [스타일링 컨벤션](#7-스타일링-컨벤션)을 따르고 자체 `metadata` 설정.

---

## 1. 개요 / 역할

- **인증 체인 검증 하니스**: 구글 로그인 버튼 하나로 **발급(프론트 SDK) → Bearer → 백엔드 `getUser`** 전체 체인을 눈으로 확인한다. 로그인 후 `/api/me`를 호출해 본인 신원(JSON)을 화면에 출력.
- **출시용 공개 페이지**: `/policy`(Privacy Policy·Terms of Service), `/support`(고객 지원), `/account-deletion`(계정 삭제 요청 — Google Play "앱 외부 삭제 요청 URL" 요건). 로그인 없이 접근 가능 — App Store·Google Play/OAuth 심사 제출용.
- **언어 정책**: 공개 페이지(`/policy`·`/support`·`/account-deletion`)는 **영문 단일**로 유지한다. 랜딩만 **한국어·영어·일본어 3개 언어**를 각각 `/ko`·`/en`·`/ja`로 제공하고(네비게이션의 언어 스위치로 전환), `/`는 미들웨어가 브라우저 언어를 보고 셋 중 하나로 보낸다. 따라서 **ko·ja 랜딩에서도 푸터의 방침·약관·고객지원 링크는 영문 페이지로 간다** — 의도된 동작이다.
- 미들웨어가 없어 **새 라우트는 기본 public**이다(아래 [라우트](#3-라우트) 참조).

## 2. 기술 스택

| 항목 | 값 |
|---|---|
| 프레임워크 | Next.js 15 (App Router), React 19 |
| 데이터/인증 | `@supabase/supabase-js` |
| 마크다운 | `react-markdown` + `remark-gfm` — `/policy` 렌더 전용 |
| 언어 | TypeScript(`strict`), `target ES2017`, `jsx: preserve` |
| 경로 별칭 | `@/*` → `./*` |
| 포트 | **3001** (`dev`/`start`). 백엔드는 3000 |
| 스크립트 | `dev` / `build` / `start` / `lint` / `typecheck` |

## 3. 라우트

App Router(`app/`). `pages/` 없음. **라우트 가드 없음** → 모든 라우트는 기술적으로 public이며, 홈의 "잠김"은 컴포넌트 내부 조건부 렌더링일 뿐이다.

**라우트 그룹으로 루트 레이아웃이 둘이다** — `app/layout.tsx`는 없다.

| 그룹 | 루트 레이아웃 | `<html lang>` | 스타일 |
|---|---|---|---|
| `(landing)` | `app/(landing)/[lang]/layout.tsx` | `ko`/`en`/`ja` (언어별) | `landing.module.css` 자체 토큰 |
| `(site)` | `app/(site)/layout.tsx` | `en` (영문 전용 페이지) | `globals.css` 다크 토큰 |

이렇게 나눈 덕에 **정적 프리렌더를 유지한 채로** 언어별 `<html lang>`을 낼 수 있다. 대신 두 그룹 사이 이동(랜딩 ↔ `/policy` 등)은 클라이언트 내비게이션이 아니라 전체 페이지 로드가 된다 — 정적 페이지들이라 문제 없다.

`middleware.ts`가 하나 있지만 인증과 무관하다. `matcher`가 **`/` 하나뿐**이며 언어 분기만 담당한다([랜딩](#5-랜딩-ko-en-ja) 참조).

| 경로 | 파일 | 타입 | 접근 | 용도 |
|---|---|---|---|---|
| `/` | `middleware.ts` | 리다이렉트(Edge) | **공개** | 언어 감지 후 `/ko`·`/en`·`/ja`로 307. 우선순위: 선택 쿠키 > `Accept-Language` > `ko` |
| `/ko` `/en` `/ja` | `app/(landing)/[lang]/page.tsx` | 서버(`force-static` + `generateStaticParams`) | **공개** | 마케팅 랜딩. `dynamicParams = false`라 그 외 값은 404 |
| `/auth/callback` | `app/auth/callback/page.tsx` | 클라이언트 | 공개(전이) | OAuth 랜딩. `?code=` 자동 교환 후 `/`로 replace, 7s 타임아웃 |
| `/policy` | `app/(site)/policy/page.tsx` | 서버(`force-static`) | **공개** | `docs/policy.md`(영문)를 분리 렌더(Privacy Policy + Terms of Service) |
| `/support` | `app/(site)/support/page.tsx` | 서버(`force-static`) | **공개** | 고객 지원(문의 채널·FAQ, 영문) |
| `/account-deletion` | `app/(site)/account-deletion/page.tsx` | 서버(`force-static`) | **공개** | 계정 삭제 안내(영문): 앱 내 절차 + 이메일 요청(복사 카드) |

## 4. 인증 / 데이터 흐름

`lib/supabaseClient.ts`:
- **모듈 레벨 싱글톤** `supabase` — strict-mode 재마운트에도 클라이언트 하나만 유지.
- 옵션: **`flowType: "pkce"`**(기본 implicit 대신 명시), `detectSessionInUrl: true`(콜백에서 SDK가 `?code=` 자동 교환 — 수동 `exchangeCodeForSession` 불필요), `persistSession: true`, `autoRefreshToken: true`.
- **`API_BASE`** = `NEXT_PUBLIC_API_BASE`(백엔드 base URL, 빌드 타임 인라인).

체인(홈 → 백엔드), `app/page.tsx`:
1. 마운트 시 `supabase.auth.getSession()`으로 세션 시드 + `onAuthStateChange` 구독(언마운트 시 해제).
2. `signIn()` → `signInWithOAuth({ provider: "google", options: { redirectTo: ${origin}/auth/callback } })`.
3. `callMe()` → `getSession()`의 `access_token`을 꺼내 `fetch(${API_BASE}/api/me, { headers: { Authorization: Bearer <token> } })` → JSON/에러 출력(CORS·네트워크 catch).
4. `signOut()` → `supabase.auth.signOut()`.

콜백(`app/auth/callback/page.tsx`): `handled` ref로 strict-mode 이중 실행 가드, `getSession()` + `onAuthStateChange`로 세션 확정 후 `/`로 이동, **7s 타임아웃**으로 무한 대기 방지(PKCE verifier 분실/다른 브라우저 동의 등 커버).

## 5. 랜딩 (`/ko`, `/en`, `/ja`)

Pencil 디자인 파일 `frontend/design/DESIGN.pen`의 `Landing — *`(1440) / `Landing — * (Mobile)`(390) 아트보드를 구현한 것이다. **디자인 수정은 .pen이 원본**이므로 문구·수치를 바꿀 때는 .pen도 같이 맞춘다.

> `design/`은 원본 에셋 20MB라 **git에 추적하지 않는다**(루트 `.gitignore`). 랜딩이 실제로 쓰는 이미지만 `images/landing/`으로 복사해 추적한다. .pen 원본은 디자인 담당자에게 받는다.

- `app/(landing)/[lang]/page.tsx` — 서버 컴포넌트 + `force-static` + `generateStaticParams()`로 세 언어를 빌드 타임 프리렌더. `dynamicParams = false`.
- `app/(landing)/[lang]/content.ts` — **언어별 카피·링크·에셋의 단일 출처**(`CONTENT: Record<Lang, LandingContent>`). 스토어 URL(`APP_STORE_URL`/`PLAY_STORE_URL`)도 여기 상수.
- `app/(landing)/[lang]/LangSwitcher.tsx` — 유일한 클라이언트 컴포넌트. 언어 pill 드롭다운(바깥 클릭·Escape로 닫힘, `role="menu"`).
- `app/(landing)/[lang]/landing.module.css` — 두 아트보드 사이를 `clamp()`로 선형 보간한다. **1440 초과 구간은 상한으로 고정하지 않고** 1440에서의 비율(vw)로 계속 확장해, 넓은 화면에서도 히어로·스크린샷이 화면을 채운다.
- 이미지는 `images/landing/`(로고·캐피·배지·스크린샷 15장)에서 정적 import → `next/image`.
- 폰트: 워드마크는 Quicksand(`next/font/google`), 본문은 Pretendard / 일본어는 Pretendard JP를 **jsDelivr 동적 서브셋 CDN**으로 로드한다(자체 호스팅 시 웨이트당 약 720KB라 과함). 링크는 `app/(landing)/[lang]/page.tsx`가 언어에 맞춰 렌더한다.
- `middleware.ts` + `lib/lang.ts` — `/` 로 들어온 요청만 언어별 랜딩으로 307 리다이렉트한다.
  - 우선순위: **직접 고른 언어 쿠키(`becappy-lang`) > `Accept-Language` > `ko`**. 쿠키는 언어 스위치로 선택했을 때만 기록된다(`LangSwitcher`의 `rememberLang`).
  - `matcher`가 `/` 하나뿐이라 `/en`·`/ja` 같은 **명시적 링크는 절대 재분기되지 않는다** — 공유 링크·스토어 등록정보 URL이 어느 브라우저에서든 그 언어로 열린다.
  - 요청 헤더·쿠키에 따라 응답이 달라지므로 `Vary: Accept-Language, Cookie`를 붙인다.
  - `lib/lang.ts`는 Edge 런타임에서 도는 미들웨어가 쓰므로 **이미지 등 무거운 import를 넣지 않는다**. 언어별 카피·에셋은 `content.ts` 담당.
  - `next.config.ts`의 `redirects()`는 미들웨어보다 **먼저** 평가된다. `/` 리다이렉트를 거기에 다시 추가하면 언어 감지가 통째로 죽는다.
- SEO/공유: `metadataBase`(`NEXT_PUBLIC_SITE_URL`)가 있어야 hreflang·`og:url`이 **절대 URL**로 나간다(상대경로면 Google이 hreflang을 무시하고 공유 카드도 깨진다). `x-default`는 언어를 감지하는 `/`를 가리키고, `og:locale`은 `ko_KR`·`en_US`·`ja_JP` 형식을 쓴다.
- `<html lang>`은 `app/(landing)/[lang]/layout.tsx`가 언어별로 낸다(`ko`/`en`/`ja`).

## 6. 공개 페이지 (`/policy`, `/support`, `/account-deletion`)

- 모두 **서버 컴포넌트 + `export const dynamic = "force-static"`** → 빌드 타임에 정적 HTML 생성(런타임 파일 I/O 없음).
- `/policy`: `docs/policy.md`(영문)를 읽어 `# Terms of Service` 헤딩 기준으로 **Privacy Policy / Terms of Service 두 섹션**(`#privacy` / `#terms`)으로 분리, `react-markdown + remark-gfm`로 렌더(GFM 테이블 지원). 방침 제8조에서 `/account-deletion`을 링크.
- `/support`: 문의 채널(카카오톡·이메일 복사 카드)·FAQ(영문, 환불은 App Store/Google Play 절차 병기). 콘텐츠는 컴포넌트 내 상수.
- `/account-deletion`: 앱 내 삭제 절차 + 앱 접근 불가 시 이메일 요청(복사 카드). 콘텐츠는 컴포넌트 내 상수(영문). 심사용 컴플라이언스 문구 없이 사용자 안내만 담는다.
- 이메일 복사 카드는 공용 컴포넌트 `components/EmailCopyCard.tsx`(클라이언트, clipboard API + 폴백)를 사용 — `/support`·`/account-deletion` 공유.

## 7. 스타일링 컨벤션

다크 테마 기준 토큰은 다음과 같다(배경·본문 텍스트는 `(site)` 그룹 루트 레이아웃 `app/(site)/layout.tsx`의 `<body>` 인라인 스타일이 기준, 나머지는 공개 페이지 CSS Module에서 사용 중인 값).

| 토큰 | 값 | 용도 |
|---|---|---|
| 배경 | `#0b0c10` | 페이지 배경 |
| 본문 텍스트 | `#e8e8e8` | 기본 글자 |
| 카드 표면 | `#16181d` / `#14161b` | 카드/박스 |
| 보더 | `#2a2c33` | 구분선/테두리 |
| 링크/포인트 | `#6ea8fe` | 공개 페이지 링크 |
| 보조 텍스트 | `#b6bdc7` / `#8b929e` | 설명/라벨 |

**가이드(앞으로):**
- 신규 페이지는 **CSS Module**(`*.module.css`)을 사용한다(공개 페이지 `policy`/`support`가 이 방식).
- 신규 **공개 페이지는 자체 `metadata`(title 등)를 반드시 설정**한다(루트 layout의 dev용 title이 fallback으로 노출되지 않도록).
- 위 다크 토큰은 공개 페이지(`/policy`·`/support`·`/account-deletion`) 전용이다. **랜딩은 라이트 브랜드 톤**이라 `app/(landing)/[lang]/landing.module.css` 안에서 자체 토큰(`--bg-room: #d5a181` 등)을 정의하고 이 값들을 쓰지 않는다.

## 8. 환경 변수

모두 `NEXT_PUBLIC_*`(브라우저 노출, **빌드 타임 번들 인라인** — 변경 시 재배포 필요).

| 키 | 설명 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable/anon 키(브라우저 노출 안전, RLS 보호) |
| `NEXT_PUBLIC_API_BASE` | 백엔드 base URL |
| `NEXT_PUBLIC_SITE_URL` | 배포 도메인. 랜딩의 `metadataBase` — hreflang·`og:url`을 절대 URL로 만든다. 미설정 시 `https://moly-server-frontend.vercel.app`로 폴백 |

> secret/service_role 키는 **절대 프론트에 두지 않는다**.

## 9. 개선 백로그

### 처리 완료
- ✅ **디자인 토큰 단일화**: `app/globals.css`의 `:root` CSS 변수로 다크 테마 토큰을 모았다(`layout.tsx`에서 import). primary blue 충돌은 앱 포인트색 `--accent`(#6ea8fe)와 구글 브랜드색 `--google`(#4285f4, 로그인 버튼 전용)으로 분리, 보더 그레이는 `--border`(#2a2c33)로 통일. 인라인/CSS Module 모두 `var(--*)` 참조.
- ✅ **`apiFetch` 헬퍼 추출**: `lib/api.ts`에 세션 토큰 추출 + `API_BASE` + Bearer 호출을 모았다(상대경로 가드 포함). `page.tsx`의 `callMe`가 사용.

### 향후 리팩토링 후보 (미적용)
- **스타일링 2종 혼재**: 인라인 스타일(`layout.tsx`, `page.tsx`, `auth/callback`)과 CSS Module(`policy`/`support`)이 공존. 토큰은 단일화됐으나 스타일 작성 방식은 아직 두 가지(전역 CSS는 `:root` 변수 정의 용도뿐). 한쪽으로 수렴 여지.
- **공용 컴포넌트 최소**: `components/`에는 `EmailCopyCard` 하나뿐. 카드/버튼/`pre` 등 반복 UI를 추가 컴포넌트화 여지.
