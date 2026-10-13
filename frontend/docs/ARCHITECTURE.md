# Frontend 아키텍처

BeCappy의 **마케팅 랜딩과 공개 페이지**(개인정보 처리방침·고객 지원·계정 삭제 안내)를 제공하는 Next.js 앱이다. 계정 API는 별도 `backend/` 프로젝트가 담당한다.

> 이 문서가 frontend 구조의 **단일 출처**다. 라우트·env·스타일 토큰의 상세는 항상 여기에 기록하고, 루트 `README.md`는 요약 + 링크만 둔다.
>
> **문서 갱신 규칙**: 라우트 추가 → [라우트](#3-라우트) 표 갱신 / env 추가 → [환경 변수](#8-환경-변수) 표 갱신 / 새 공개 페이지 → [스타일링 컨벤션](#7-스타일링-컨벤션)을 따르고 자체 `metadata` 설정.

---

## 1. 개요 / 역할

- **마케팅 랜딩**: 앱 소개와 App Store·Google Play 링크를 제공한다. 프론트엔드에서 로그인하거나 계정 API를 호출하지 않는다.
- **출시용 공개 페이지**: `/policy`(Privacy Policy·Terms of Service), `/support`(고객 지원), `/account-deletion`(계정 삭제 요청 — Google Play "앱 외부 삭제 요청 URL" 요건). 로그인 없이 접근 가능 — App Store·Google Play/OAuth 심사 제출용.
- **언어 정책**: 공개 페이지(`/policy`·`/support`·`/account-deletion`)는 **영문 단일**로 유지한다. 랜딩만 **한국어·영어·일본어 3개 언어**를 각각 `/ko`·`/en`·`/ja`로 제공하고(네비게이션의 언어 스위치로 전환), `/`는 미들웨어가 브라우저 언어를 보고 셋 중 하나로 보낸다. 따라서 **ko·ja 랜딩에서도 푸터의 방침·약관·고객지원 링크는 영문 페이지로 간다** — 의도된 동작이다.
- 인증 미들웨어가 없어 **새 라우트는 기본 public**이다. 언어 선택 미들웨어만 사용한다.

## 2. 기술 스택

| 항목 | 값 |
|---|---|
| 프레임워크 | Next.js 15 (App Router), React 19 |
| 마크다운 | `react-markdown` + `remark-gfm` — `/policy` 렌더 전용 |
| 언어 | TypeScript(`strict`), `target ES2017`, `jsx: preserve` |
| 경로 별칭 | `@/*` → `./*` |
| 포트 | **3001** (`dev`/`start`). 백엔드는 3000 |
| 스크립트 | `dev` / `build` / `start` / `lint` / `typecheck` / `fonts`(랜딩 제목 서체 서브셋, [랜딩](#5-랜딩-ko-en-ja) 참조) |

## 3. 라우트

App Router(`app/`). `pages/` 없음. **인증 라우트 가드 없음** → 모든 페이지는 공개다.

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
| `/policy` | `app/(site)/policy/page.tsx` | 서버(`force-static`) | **공개** | `docs/policy.md`(영문)를 분리 렌더(Privacy Policy + Terms of Service) |
| `/support` | `app/(site)/support/page.tsx` | 서버(`force-static`) | **공개** | 고객 지원(문의 채널·FAQ, 영문) |
| `/account-deletion` | `app/(site)/account-deletion/page.tsx` | 서버(`force-static`) | **공개** | 계정 삭제 안내(영문): 앱 내 절차 + 이메일 요청(복사 카드) |

## 4. 데이터와 서비스 경계

랜딩 콘텐츠는 `content.ts`, 정책 본문은 `docs/policy.md`, 지원·삭제 안내는 각 페이지의 상수에서 읽는다. 계정 API 호출, Supabase SDK, 웹 로그인 callback은 현재 프론트엔드에 없다.

공개 사이트 도메인 변경은 모바일 인증 callback이나 계정 API 주소 변경을 요구하지 않는다. 배포·도메인 전환 순서와 검증 기록은 [도메인 이전 계획](BECAPPY-DOMAIN-MIGRATION-PLAN.md)을 참고한다.

## 5. 랜딩 (`/ko`, `/en`, `/ja`)

App Store 스크린샷(별도 작업 폴더 `app-store-design`)과 같은 색과 서체, 폰 프레임을 쓰는 페이지다. 제목 문구도 스크린샷과 같다. 이전 버전의 원본이던 `design/DESIGN.pen`의 `Landing` 아트보드는 더 이상 이 페이지와 맞지 않는다.

> `design/`은 원본 에셋이라 **git에 추적하지 않는다**(루트 `.gitignore`). 랜딩이 실제로 쓰는 이미지만 `images/landing/`으로 뽑아 추적한다.

구성은 위에서부터 히어로, 기능 다섯 개(루틴, 대화, 캐피의 일기, 감정 기록, 꾸미기), 후기, FAQ, 다운로드(`#download`), 푸터 순서다. 기능 섹션은 제목과 설명 한 단락, 앱 화면 하나로만 이루어진다.

- `app/(landing)/[lang]/page.tsx`: 서버 컴포넌트 + `force-static` + `generateStaticParams()`로 세 언어를 빌드 타임 프리렌더. `dynamicParams = false`. 메타데이터와 마크업을 모두 여기서 낸다.
- `app/(landing)/[lang]/copy/{ko,en,ja}.ts`: **언어별 문구의 단일 출처**(모양은 `copy/types.ts`). 용어는 앱 문구(becappy-mobile `lib/l10n/app_*.arb`)를 따른다. 제목 문자열의 `\n`은 넓은 화면에서의 줄바꿈 위치다.
- `app/(landing)/[lang]/content.ts`: 문구에 이미지와 스토어 링크를 붙여 `CONTENT: Record<Lang, LandingContent>`를 만든다. App Store는 ko→`/kr`+`l=ko`, en→`/us`+`l=en-US`, ja→`/jp`+`l=ja`로 연결하며 기존 캠페인 파라미터(`pt`, `ct`, `mt`)를 보존한다. Google Play는 `hl=ko/en/ja`로 웹 표시 언어를 지정한다. 실제 설치 시 스토어 앱은 사용자 계정 국가와 기기 언어의 영향을 받을 수 있다.
- `app/(landing)/[lang]/LangSwitcher.tsx`: 유일한 클라이언트 컴포넌트. 언어 pill 드롭다운(바깥 클릭이나 Escape로 닫힘, `role="menu"`).
- `Phone.tsx`(폰 프레임 + 앱 화면), `StoreBadges.tsx`(스토어 배지), `Heading.tsx`(제목 줄바꿈), `structured-data.ts`(JSON-LD).
- `app/(landing)/[lang]/landing.module.css`: 토큰은 `.page`에 있다. 960px 이상에서 글과 그림이 두 단이 된다.
- 이미지(`images/landing/`, 정적 import → `next/image`):
  - `<lang>/`: 언어마다 다른 앱 화면 캡처 다섯 장. app-store-design의 `captures/<lang>/`에서 상단 150px(상태 표시줄 자리)을 자르고 900px 폭 WebP로 줄였다. 새 캡처로 바꿀 때는 같은 이름으로 덮어쓰면 된다.
  - `art/`: 히어로의 캐피(SVG, svgo 최적화라 `unoptimized`로 쓴다)와 배지 위의 새.
- 폰트:
  - 제목: 여기어때 잘난체2(ko/en, GC COMPANY 무료 배포 및 수정 허용) / M PLUS Rounded 1c Black(ja, OFL). **문구에 쓰인 글자만 서브셋**해 `public/fonts/<이름>.<해시>.woff2`로 둔다(각 50KB 안팎, 원본은 3~4MB). `npm run fonts`(`scripts/subset-display-fonts.mjs`)가 `copy/*.ts`를 읽어 다시 만들고 `display-fonts.ts`를 갱신한다. 원본 TTF는 `design/assets/fonts/`(git 미추적)에 둔다. **문구를 고친 뒤에는 꼭 다시 실행한다.** 그러지 않으면 새 글자만 다른 서체로 보인다.
  - 페이지는 자기 언어의 제목 서체 하나만 `@font-face`로 선언하고 preload 한다. 파일 이름에 해시가 있어 `next.config.ts`가 `/fonts/*`를 immutable로 캐시한다.
  - 워드마크와 태그라인("Don't Worry, Be Cappy")은 Quicksand(`next/font/google`), 본문은 Pretendard / 일본어는 Pretendard JP를 **jsDelivr 동적 서브셋 CDN**으로 로드한다(자체 호스팅 시 웨이트당 약 720KB라 과함).
- 공유 카드: `public/og/<lang>.png`(1200×630). 히어로의 배지 문구와 제목이 들어 있으므로 **그 문구를 바꾸면 이미지도 다시 만든다**.
- `middleware.ts` + `lib/lang.ts` — `/` 로 들어온 요청만 언어별 랜딩으로 307 리다이렉트한다.
  - 우선순위: **직접 고른 언어 쿠키(`becappy-lang`) > `Accept-Language` > `ko`**. 쿠키는 언어 스위치로 선택했을 때만 기록된다(`LangSwitcher`의 `rememberLang`).
  - `matcher`가 `/` 하나뿐이라 `/en`·`/ja` 같은 **명시적 링크는 절대 재분기되지 않는다** — 공유 링크·스토어 등록정보 URL이 어느 브라우저에서든 그 언어로 열린다.
  - URL의 pathname만 바꾸므로 UTM 등 query를 보존한다.
  - 요청 헤더·쿠키에 따라 응답이 달라지므로 `Vary: Accept-Language, Cookie`를 붙인다.
  - `lib/lang.ts`는 Edge 런타임에서 도는 미들웨어가 쓰므로 **이미지 등 무거운 import를 넣지 않는다**. 언어별 카피·에셋은 `content.ts` 담당.
  - `next.config.ts`의 `redirects()`는 미들웨어보다 **먼저** 평가된다. `/` 리다이렉트를 거기에 다시 추가하면 언어 감지가 통째로 죽는다.
- SEO/공유: `lib/site-url.ts`의 공통 `SITE_URL`을 사용한다. `metadataBase`(`NEXT_PUBLIC_SITE_URL`)가 있어야 hreflang·`og:url`이 **절대 URL**로 나간다(상대경로면 Google이 hreflang을 무시하고 공유 카드도 깨진다). `x-default`는 언어를 감지하는 `/`를 가리키고, `og:locale`은 `ko_KR`·`en_US`·`ja_JP` 형식을 쓴다.
  - 제목은 `<h1>` 하나(히어로), 섹션마다 `<h2>`, FAQ 질문은 `<h3>`. 기능 설명과 FAQ가 모두 본문 텍스트라 검색엔진이 읽을 수 있고, 앱 화면 이미지에는 화면 내용을 적은 `alt`가 있다.
  - `og:image`와 `twitter:card`(summary_large_image), iOS 스마트 앱 배너(`apple-itunes-app`), 사업자등록번호가 전화번호 링크로 바뀌지 않게 하는 `format-detection`을 낸다.
  - JSON-LD(`structured-data.ts`): Organization, WebSite, MobileApplication(무료, iOS와 Android), WebPage, FAQPage. 평점은 스토어마다 다르고 계속 바뀌어서 넣지 않는다.
  - `app/sitemap.ts`는 언어별 랜딩에 hreflang 대안(`xhtml:link`)을 함께 낸다.
- `<html lang>`은 `app/(landing)/[lang]/layout.tsx`가 언어별로 낸다(`ko`/`en`/`ja`).

## 6. 공개 페이지 (`/policy`, `/support`, `/account-deletion`)

- `(site)/layout.tsx`가 공통 `metadataBase`를 설정하고 각 페이지가 자기 경로의 canonical을 선언한다.
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
- 위 다크 토큰은 공개 페이지(`/policy`, `/support`, `/account-deletion`) 전용이다. **랜딩은 라이트 브랜드 톤**이라 `app/(landing)/[lang]/landing.module.css`의 `.page`에 자체 토큰(`--bg: #faf3e4`, `--ink: #4a3526`, `--orange: #d96510` 등 App Store 스크린샷과 같은 값)을 정의하고 이 값들을 쓰지 않는다.

## 8. 환경 변수

모두 `NEXT_PUBLIC_*`(브라우저 노출, **빌드 타임 번들 인라인** — 변경 시 재배포 필요).

| 키 | 설명 |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | 정규 사이트 URL. `lib/site-url.ts`에서 랜딩·공개 페이지의 metadataBase로 공유한다. 미설정 시 `https://becappy.io`로 폴백. Production에 같은 값을 설정한 후 재빌드한다 |

> secret/service_role 키는 **절대 프론트에 두지 않는다**.

## 9. 개선 백로그

### 처리 완료
- ✅ **디자인 토큰 단일화**: `app/globals.css`의 `:root` CSS 변수로 다크 테마 토큰을 모았다(`layout.tsx`에서 import). primary blue 충돌은 앱 포인트색 `--accent`(#6ea8fe)와 구글 브랜드색 `--google`(#4285f4, 로그인 버튼 전용)으로 분리, 보더 그레이는 `--border`(#2a2c33)로 통일. 인라인/CSS Module 모두 `var(--*)` 참조.

### 향후 리팩토링 후보 (미적용)
- **스타일링 2종 혼재**: 인라인 스타일(`layout.tsx`, `page.tsx`)과 CSS Module(`policy`/`support`)이 공존. 토큰은 단일화됐으나 스타일 작성 방식은 아직 두 가지(전역 CSS는 `:root` 변수 정의 용도뿐). 한쪽으로 수렴 여지.
- **공용 컴포넌트 최소**: `components/`에는 `EmailCopyCard` 하나뿐. 카드/버튼/`pre` 등 반복 UI를 추가 컴포넌트화 여지.
