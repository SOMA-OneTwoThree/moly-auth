# becappy.io 공개 페이지 이전 계획

작성일: 2026-09-18 · 재검토판 v2 · 상태: 계획 검증 완료, 구현·콘솔 변경 전

사용자 확인: 도메인 구매만 완료했으며 DNS·Vercel 연결 작업은 아직 하지 않았다. 현재 DNS 미응답은 신규 연결 전의 상태로 기록하며, 운영 중인 서비스 장애로 분류하지 않는다.

## 1. 권장 결정

이번 이전은 **사용자에게 보이는 웹사이트를 becappy.io로 전환하는 작업**으로 한정한다. 기존 Vercel 프로젝트에 도메인을 추가하며, 호스팅·데이터베이스를 이사하지 않는다.

계정 API 주소 변경은 이번 목적의 선행 조건이 아니다. 공개 페이지 전환을 먼저 완료하고, `account.becappy.io`는 별도 선택 작업으로 진행한다. 이렇게 하면 설치된 앱의 인증·계정 통신 경로에 새 DNS 의존성을 추가하지 않고도 목적을 달성한다.

| 대상 | 목표 | 이번 범위 |
|---|---|---|
| 랜딩 | `https://becappy.io/ko`, `/en`, `/ja` | 필수 |
| 개인정보·약관 | `https://becappy.io/policy`, `/policy#terms` | 필수 |
| 지원·계정 삭제 안내 | `https://becappy.io/support`, `/account-deletion` | 필수 |
| 광고 판매자 파일 | `https://becappy.io/app-ads.txt` | 필수 |
| www | `www.becappy.io` → `becappy.io`, 경로 보존 | 필수 |
| 구 공개 웹 주소 | 기존 프로젝트 유지, 새 주소로 리다이렉트 | 필수 |
| 운영 계정 API | `moly-server.vercel.app` 계속 직접 응답 | 유지 |
| 새 계정 API 별칭 | `account.becappy.io`, 기존과 동시 서빙 | 선택·후속 |
| 개발 계정 API | `moly-server-dev.vercel.app` | 유지 |
| 기능 API | `voice.moly.asia`, `dev.moly.asia` | 유지 |

## 2. 조사 범위와 실제 확인 결과

다섯 디렉터리의 구성과 도메인 참조를 조사하고, 이전에 영향을 주는 실행 코드를 집중 확인했다. 모든 기능의 전체 품질 감사를 수행했다는 의미는 아니다.

- `moly-auth`: 공개 라우트 전체, 언어 미들웨어·쿠키, 메타데이터, 정적 파일, 계정 API 라우트·Bearer 인증·CORS, Next 설정과 패키지 스크립트.
- `becappy-mobile`: 공개 링크, prod/dev 인증 환경, Dio 계정 클라이언트, 소셜 로그인 콜백, Remote Config, iOS/Android 링크 테스트, 광고·결제 설정.
- `moly-backend`: 역할 경계, 기능 API 주소, 광고 SSV·결제 웹훅과 환경 설정.
- `moly-infra`: ALB/nginx 배포 구조, 기존 인프라 문서 및 Git 추적 여부.
- `cappy-studio`: 제작 스크립트·문서와 도메인 참조 검색. 이번 도메인 전환에 필요한 실행 코드 변경은 발견하지 못함.

코드 기준: moly-auth `b59e639`, becappy-mobile `84d816e`. 로컬 HEAD와 Vercel 운영 배포 SHA가 같은지는 콘솔 확인이 필요하다.

### 1차 검증: 코드와 참고 계획 대조

1. 공개 프론트엔드는 현재 Supabase 로그인이나 계정 API 호출을 하지 않는다. 프론트 아키텍처 문서의 로그인 하니스 설명은 오래된 내용이다.
2. 랜딩의 `metadataBase`는 `NEXT_PUBLIC_SITE_URL`을 사용한다. Production 환경변수 변경 후 **재빌드·재배포**가 필요하다.
3. `/policy`, `/support`, `/account-deletion`에는 현재 canonical이 없다. 랜딩의 환경변수만 바꾸면 이 세 페이지의 canonical이 생기는 것은 아니다.
4. 앱 공개 링크 변경은 `app_config.dart`의 **3곳**이다. 계정 API까지 바꿀 때만 `auth_environment.dart`의 prod 1곳이 추가된다. iOS 약관은 Apple 표준 EULA를 유지한다.
5. `becappy-lang`은 host-only 쿠키다. 새 도메인 첫 방문 시 기존 언어 선택은 전달되지 않는다. 명시적인 `/en`, `/ja` 링크는 그대로 유지한다.
6. 계정 API는 Bearer 토큰 기반이다. 네이티브 앱을 위해 프론트 새 도메인을 CORS 허용 목록에 추가할 필요는 없다. 향후 브라우저 호출이 있을 때 별도 판단한다.
7. `moly-infra/docs/`는 `.gitignore` 대상이며 `docs/INFRA.md`도 현재 추적되지 않는다. 여기에만 런북을 쓰면 Git으로 공유되지 않는다. `moly-auth/docs/`도 루트 ignore 대상이므로, 이 문서는 기존 문서가 추적되는 `moly-auth/frontend/docs/`에 둔다.
8. 참고 문서에 주소 변경 대상으로 적힌 모바일 `docs/BANNER_SDUI.md`, `docs/testflight-upload.md`의 현재 vercel 주소는 dev 주소다. 이 주소는 변경하지 않는다.

### 2차 검증: 공개 DNS·HTTP 실측

2026-09-18, 인증 토큰 없이 DNS 조회 및 GET/OPTIONS 요청만 수행했다.

| 항목 | 실제 결과 |
|---|---|
| becappy.io NS, Cloudflare 1.1.1.1 | SERVFAIL, 위임 대상에서 REFUSED 진단 |
| becappy.io NS, Google 8.8.8.8 | SERVFAIL, 여러 위임 대상에서 REFUSED 진단 |
| becappy.io / www / account HTTPS | 이름 해석 실패(curl exit 6) |
| 구 프론트 `/` | 307 → `/ko` |
| 구 프론트 `/ko`, `/en`, `/ja` | 모두 200 |
| 구 프론트 `/policy`, `/support`, `/account-deletion` | 모두 200 |
| 구 프론트 `/app-ads.txt` | 200, text/plain, 로컬 파일의 publisher ID 확인 |
| 구 프론트 `/robots.txt`, `/sitemap.xml` | 모두 404 |
| prod/dev 계정 `/health` | 모두 200 |
| prod/dev 계정 `/me`, 무토큰 | 모두 401 |
| prod/dev 계정 `/me`, OPTIONS | 모두 204 |

추가 교차 검증:

- 영어·일본어 Accept-Language에 각각 `/en`, `/ja`로 이동한다.
- 영어 헤더 + 일본어 쿠키 조합에서 `/ja`로 이동한다. `Vary: Accept-Language, Cookie`가 있다.
- 세 언어 랜딩의 canonical·hreflang·og:url은 현재 구 vercel 도메인이다.
- `/?utm_source=migration-check` 요청이 `/en`으로 이동하며 **쿼리가 사라지는 기존 동작**을 확인했다. 이전 시 유입 링크를 보존하려면 언어 미들웨어도 함께 수정해야 한다.

도메인 구매만 완료된 상태라는 사용자 설명을 반영한다. 별도 장애 복구 프로젝트를 만들지 않고 최초 DNS 연결 절차 안에서 처리한다. SERVFAIL을 단순한 A 레코드 미등록으로 단정하지 않는다. 가비아 DNS 서비스 활성화, 등록된 네임서버와 실제 zone 일치 여부, 위임·DNSSEC 상태를 확인해야 한다. 현재 증거만으로 구매 실패나 만료라고 판단할 수 없다.

### 3차 검증: 공식 문서와 장애·롤백 반례

| 참고 계획의 주장 | 검증 후 판단 |
|---|---|
| 계정 API 리다이렉트 시 GET은 살아남음 | 부정확. Dart는 다른 도메인으로 이동할 때 Authorization을 제거하므로 GET `/me`도 인증 실패할 수 있다. POST/PATCH/DELETE 자동 추적 제한까지 있으므로 API 리다이렉트 금지 |
| 광고 없는 앱이라 Hobby 유지 | 현재 코드에 보상형 광고·인앱 구매·RevenueCat 구성이 있다. 실제 수익화 상태와 Vercel 사용 목적을 확인해야 하며 낮은 트래픽은 비상업용 자격의 근거가 아님 |
| app-ads.txt는 총 1홉만 허용 | Google 설명은 원래 루트 도메인 밖으로의 리다이렉트 제한과 내부 이동을 구분한다. 무조건 총 1홉이라는 설명은 부정확. 운영 설계는 여전히 구 주소 → 새 파일 직접 1홉을 권장 |
| 모든 경로가 최종 응답까지 1홉 | `/`는 구 host → 새 `/` → 언어 페이지로 정상적으로 2홉일 수 있음. `/app-ads.txt`, `/policy` 등은 1홉 목표 |
| Domains 화면에서 구 vercel 주소의 307 설정 가능 확정 | 일반 도메인 리다이렉트 기능은 확인됨. 해당 기본 alias의 편집·상태코드 선택은 실제 콘솔에서 확인해야 함. 불가하면 host 조건의 Next redirect 사용 |
| 단계적 출시가 앱 롤백 경로 | 이미 업데이트한 앱을 되돌리지 않음. iOS 수동 다운로드도 가능. 새 API 도메인 장애는 DNS/도메인 복구 또는 앱 수정 배포가 필요 |
| 최소 버전 상향이 도메인 이전 정리 단계 | 공개 URL 교체만으로 강제 업데이트할 이유 없음. RC 실패 폴백도 있어 기존 호스트 폐기 근거로 사용할 수 없음 |
| DNS 삭제 시 약 90일 뒤 장애 | DNS 경로 자체가 깨지면 즉시 또는 캐시 만료 뒤 장애 가능. 인증서 갱신 실패만의 문제가 아님 |
| 307 후 308 전환 시점 | 참고 문서의 1~2주/1~3개월이 불일치. 본 계획은 7~14일 관측과 합격 조건을 제안하며, 기간 경과만으로 자동 전환하지 않음 |

## 3. 실행 단계와 통과 조건

### A. 배포 전 확인

- [ ] 가비아 도메인 상태, 필요한 등록자 확인, 자동갱신·만료일을 확인한다. `.io`에 특정 인증 기한이 적용된다고 일괄 가정하지 않고 가비아 안내를 따른다.
- [ ] DNS 관리 접근 및 현재 네임서버를 확인한다. 현재 레코드가 없으면 없음으로 기록하고, 있으면 TTL과 함께 백업한다. 실제 DNS 활성화·레코드 입력과 정상 응답 검증은 B에서 수행한다.
- [ ] Vercel에서 프론트/backend/dev 프로젝트, Git 저장소·Production Branch·Root Directory·현재 배포 SHA·도메인 목록을 기록한다. 로컬 디렉터리 이름과 프로젝트 이름이 같다고 가정하지 않는다.
- [ ] 같은 Git 저장소에 연결된 backend/dev 프로젝트의 Root Directory, 변경 없는 프로젝트 배포 생략 설정과 Ignored Build Step을 확인한다. 프론트 PR이 API 배포를 유발하지 않는다고 가정하지 않는다. 함께 배포되면 배포 상태와 기존 `/health`·무토큰 `/me`를 전후 비교한다.
- [ ] Production `NEXT_PUBLIC_SITE_URL` 현재값, 배포 보호·방화벽·봇 차단 설정을 확인한다. API의 기존 도메인은 삭제하거나 redirect 대상으로 지정하지 않는다.
- [ ] Vercel 플랜 적합성을 확인한다. 상업적 이용이면 Pro 등 허용되는 플랜을 사용한다. 구매·요금 변경은 실제 실행 시 별도 결정한다.
- [ ] 스토어·OAuth·소셜 콘솔의 현재 URL과 편집 가능 상태를 기록한다. OAuth 변경이 검증을 유발하는지 먼저 확인한다.

**통과 조건:** DNS를 편집할 위치와 권한 확인, 올바른 Production 프로젝트 식별, 기존 설정 복구 자료 확보. A/AAAA의 정상 응답을 레코드 추가 전 선행 조건으로 요구하지 않는다. 사이트 연결을 위해 Search Console 인증 완료까지 기다릴 필요는 없다. Search Console은 OAuth 도메인 검증/검색 등록에 필요한 시점 전에 완료한다.

### B. 새 도메인 추가와 웹 변경

0. 코드 변경안은 로컬/Preview에서 먼저 검증한다. 도메인 설정 전에 Production에 머지하지 않는다. B의 웹 PR과 C의 구 호스트 redirect PR/설정은 분리해, 새 도메인이 준비되기 전에 구 트래픽이 이동하는 일을 방지한다.
1. 기존 프론트 Vercel 프로젝트에 `becappy.io`, `www.becappy.io`를 추가한다. 새 프로젝트를 만들 필요는 없다.
2. 가비아에서 DNS 관리 서비스를 활성화하고 위임된 네임서버와 zone이 일치하는지 확인한다. DNS 레코드로 Vercel에 연결하며 가비아의 URL 포워딩/웹 파킹 기능을 사용하지 않는다. 가비아의 **실제 권위 DNS**에 Vercel 화면에서 제시한 apex A와 www CNAME을 입력한다. 참고 문서의 IP를 그대로 복사하지 않는다. 충돌하는 주차용 A/AAAA/CNAME 여부를 확인한다. 기존 MX/TXT는 보존한다.
3. CAA 제한이 있을 때 Vercel의 인증서 발급 요건을 반영한다. 네임서버 전체 이전, 와일드카드 도메인, 이메일용 SPF/DMARC 변경은 이번 필수 작업에서 제외한다.
4. 실제 권위 NS 및 1.1.1.1/8.8.8.8에서 기대 A/CNAME 응답을 확인한다. SERVFAIL이 지속되면 zone·위임·DNSSEC를 진단한다. 새 도메인이 Production에 연결되고 TLS가 유효한지 확인한다. 이 시점까지 구 공개 주소는 그대로 서빙한다.
5. Production `NEXT_PUBLIC_SITE_URL=https://becappy.io`를 **먼저 설정한 뒤** 검증된 웹 PR을 배포·재빌드한다. 구 환경변수로 빌드한 산출물을 그대로 승격하지 않는다. 새 배포 HTML에서 실제 canonical·hreflang·og:url을 확인한다.
6. www는 apex로 경로·쿼리를 보존해 이동시킨다. Vercel의 반대 방향 추천을 그대로 수락해 루프를 만들지 않는다.

웹 PR 내용(도메인 연결과 직접 링크 전환이 필수 작업이며, 기존 UTM 손실 수정·공개 페이지 canonical 보강은 함께 권장하는 작은 개선이다. robots/sitemap은 별도 선택 작업):

| 파일 | 변경 |
|---|---|
| `frontend/app/(landing)/[lang]/page.tsx` | SITE_URL 폴백을 becappy.io로 변경 |
| `frontend/app/(site)/layout.tsx` 및 공개 페이지 3개 | metadataBase와 페이지별 canonical 추가. 모든 페이지의 canonical을 `/` 하나로 지정하지 않음 |
| `frontend/middleware.ts` | 기존 언어 선택·Vary 유지, request URL 복사 후 pathname만 바꿔 쿼리 보존 |
| `frontend/docs/ARCHITECTURE.md` | 현재 공개 사이트 구조·도메인·배포 환경변수·복구 절차 반영, 오래된 로그인 하니스 설명 정정 |
| `frontend/app/robots.ts`, `frontend/app/sitemap.ts` | 검색 등록을 함께 정리할 경우 추가 권장. 사이트 접근의 필수 조건은 아님. 정규 도메인의 실제 6개 페이지를 기준으로 작성 |

**통과 조건:** 새 도메인의 공개 6개 페이지 및 광고 파일 정상, 언어 분기·메타데이터·이미지/폰트/스토어 링크 정상, 인증이나 봇 challenge 없이 접근 가능. 프론트 lint/typecheck/build 통과. 공용 정책 본문·언어·문의 이메일은 이번 도메인 변경으로 변경하지 않는다.

### C. 구 링크 전환

1. 구 `moly-server-frontend.vercel.app`에만 307 host 리다이렉트를 적용한다. 대시보드에서 지원되는지 확인하고, 지원되지 않으면 `frontend/next.config.ts`에서 정확한 host 조건 + `/:path*` + `permanent: false`로 구현한다. host value는 정규식으로 해석되므로 JavaScript 문자열에서 `moly-server-frontend\\.vercel\\.app`처럼 점을 이스케이프한다. 도메인 리다이렉트와 코드 규칙을 동시에 활성화하지 않는다.
2. `next.config.ts`의 기존 주석은 무조건적인 `/` 언어 redirect를 금지하는 내용이다. 구 host에만 적용하는 규칙은 새 도메인의 언어 미들웨어와 양립한다. 전체 `*.vercel.app` 또는 모든 host에 적용하지 않는다. Preview를 강제로 Production에 보내지 않는다. 새 도메인에서 다시 redirect가 걸리는 루프가 없어야 한다. 구 탭에서 로딩 중인 `/_next/static`·이미지 요청도 점검하고 기존 배포 자산을 성급히 제거하지 않는다.
3. 도메인 이동은 경로와 쿼리를 보존한다. 브라우저에서 `/policy#terms`의 해시와 약관 섹션 이동을 검증한다. 해시는 HTTP 요청에 포함되지 않으므로 curl만으로 검증 완료라고 쓰지 않는다.
4. 구 `/app-ads.txt` → 새 `/app-ads.txt` 직접 1홉과 최종 text/plain 200을 확인한다. 파일 내용은 동일하게 유지한다.
5. 기존 앱을 업데이트하지 않은 상태에서 로그인 화면·계정 화면의 정책/약관/지원 링크가 새 사이트에 도달하는지 확인한다.

**통과 조건:** old/new/www × 공개 경로·언어·쿼리 매트릭스 통과, API 기존 주소 응답 유지, 리다이렉트 해제 복구 절차 확인. 307도 실제 Cache-Control을 점검하며 상태코드만으로 캐시가 전혀 없다고 가정하지 않는다. 검증 기간에는 장기 max-age/s-maxage를 설정하지 않는다. `/policy/` 같은 비정규 trailing slash와 HTTP→HTTPS 전환은 추가 홉이 있을 수 있으므로, 1홉 기준은 정규 HTTPS URL에 적용한다.

### D. 외부 공개 URL 갱신

새 페이지 검증이 끝난 뒤 진행한다. DNS 추가와 같은 순간에 일괄 교체하지 않는다.

| 위치 | 변경/확인 대상 |
|---|---|
| Google Play | 개인정보 URL `/policy`, 계정 삭제 안내 `/account-deletion`, 앱 연락처 웹사이트와 해당 시 개발자 페이지 웹사이트 |
| App Store Connect | 실제 존재하는 ko/en/ja 현지화별 개인정보·Support·Marketing URL. 편집 불가 항목은 다음 버전 제출과 함께 처리 |
| AdMob | Android는 Play의 앱 연락처 웹사이트, iOS는 App Store의 Marketing URL이 발견 기준이다. Support URL이나 계정 전체 개발자 페이지와 혼동하지 않는다. 스토어 실제 공개 페이지의 Developer Website가 바뀐 것을 확인한 뒤 Android/iOS 각각 새 파일 발견·publisher ID·검증 상태 확인. 반영에 24시간 이상 걸릴 수 있으므로 UI의 실제 상태로 완료 판단 |
| Google Auth Platform | 홈페이지·개인정보·약관·Authorized domains. 현재 게시/브랜드 검증/스코프 상태에 따라 재검증 절차 진행 |
| Meta·LINE·Kakao | 실제 등록되어 있는 공개 정책·약관·삭제 안내·사이트 도메인 필드만 수정. 로그인 콜백 필드와 구분 |
| SNS | 사용 중인 Instagram 언어별 계정, 카카오 채널의 사이트 링크 |
| Search Console | 새 도메인 소유권 확인, sitemap/주요 URL 검사. 기존 속성 보유와 이전 기능 적용 가능 여부에 따라 주소 변경 도구 검토 |

iOS Marketing URL이 다음 버전까지 편집 불가하면 구 스토어 주소와 구 `/app-ads.txt` 경로를 계속 유효하게 유지한다. 이 항목을 E의 다음 정규 릴리스와 함께 완료하도록 기록하고, B/C의 웹 공개 전환 자체는 막지 않는다.

Supabase Auth URL configuration, Google/Apple/Kakao/LINE 인증 콜백, 앱 URL scheme, 패키지 ID·bundle ID는 공개 홈페이지와 별개다. 일괄 문자열 치환으로 수정하지 않는다. 공개 브랜드 URL을 바꾼 경우 해당 소셜 로그인은 실제 앱에서 재검증한다.

### E. 다음 모바일 릴리스에서 직접 링크 교체

구 링크 리다이렉트만으로 기존 앱은 사용할 수 있다. 이 작업을 위해 긴급 릴리스하거나 최소 지원 버전을 올리지 않는다.

- `lib/config/app_config.dart`: Android 약관, 공통 개인정보, 공통 지원 링크 3곳 변경.
- `test/config/app_config_test.dart`, `test/ui/auth/widgets/login_screen_test.dart`, `test/ui/account/widgets/account_popup_test.dart`: 해당 공개 링크 기대값 변경. prod 계정 API 기대값은 이번 웹 전용 단계에서 유지한다.
- iOS Apple EULA, 카카오 채널, 스토어 URL, dev/prod API 주소 유지.
- 프로젝트 규칙에 따라 변경 Dart 포맷 → `flutter analyze` → 관련 3개 테스트 → 전체 `flutter test` 실행. 앱 배포까지 수행할 때는 서명된 릴리스와 실기기 링크 확인을 추가한다.

### F. 안정화

- 새 `/ko`, `/policy`, `/app-ads.txt`와 구 공개 링크를 모니터링한다. DNS/TLS 실패와 잘못된 200 HTML 응답을 구분한다. 기존 API `/health`도 함께 관측한다.
- 제안 관측 기간은 7~14일. 저트래픽이므로 사용자 에러 신고가 없다는 사실만으로 판단하지 않고 합성 요청·실기기·광고 파일 검증을 포함한다.
- 스토어 링크·AdMob·정책 앵커·검색 메타데이터 정상, 신규 장애 없음, 복구 절차 확인 후 구 웹 redirect를 308로 승격한다. 영구 redirect는 브라우저 캐시 때문에 되돌리는 효과가 제한된다.
- 구 프로젝트·운영 alias는 유지한다. 앱 최소 지원 버전/권장 버전 상향은 별도 제품 결정이다.

## 4. 계정 API 도메인도 바꾸고 싶을 때의 별도 계획

이 단계 없이도 공개 사이트 이전은 완료된다.

1. 기존 운영 backend 프로젝트에 `account.becappy.io`를 **서빙 별칭**으로 추가하고 Vercel 지정 CNAME을 설정한다. 기존 `moly-server.vercel.app`도 같은 배포를 직접 서빙한다. 어느 방향으로도 redirect하지 않는다.
2. 새/구 주소에서 `/health` 200, 무토큰 `/me` 401, OPTIONS 204를 확인한다. OPTIONS 204만으로 브라우저 CORS 허용이 검증되는 것은 아니며 필요 시 허용 Origin 헤더까지 확인한다.
3. 승인된 테스트 계정으로 양쪽 `/me` 응답을 비교한다. 테스트 전용 계정에서 온보딩·프로필/알림 수정·푸시 토큰·로그아웃·탈퇴를 검증한다. 운영 사용자 데이터로 탈퇴 시험하지 않는다. 기본 점검만으로 데이터 저장소까지 정상이라고 단정하지 않는다.
4. `auth_environment.dart`의 prod 주소와 `app_config_test.dart` prod 기대값을 변경한다. dev 및 Supabase URL은 유지한다. API 문서는 새/구 주소의 동시 지원을 명시한다.
5. API 도메인 관측 및 실기기 검증 후 단계적으로 앱을 출시한다. 단계적 출시는 피해 확산을 줄이지만 이미 설치된 바이너리를 복구하지 않는다.
6. 신속한 호스트 복구가 요구되면 앱 출시에 **앞서** 원격 호스트 설정 설계를 별도 결정한다. HTTPS + 정해진 두 호스트 allowlist + 인증 헤더 유출 방지 + 캐시/오프라인 기본값 + 클라이언트 재생성까지 필요하다. POST 자동 재전송은 중복 쓰기를 만들 수 있으므로 단순 failover 재시도를 추가하지 않는다.

이번 권장은 API 주소 변경 자체를 보류해 위 복잡도를 추가하지 않는 것이다. 새 별칭만 미리 연결해 두는 것은 가능하지만 설치된 앱의 복구 수단이 되는 것은 아니다.

## 5. 롤백과 완료 판정

| 실패 지점 | 대응 |
|---|---|
| 새 DNS/TLS 미완료 | 구 주소를 계속 서빙, 공개 링크 교체·redirect 적용 중단 |
| 새 웹 배포 오류 | 기록해 둔 정상 배포 ID로 즉시 롤백. 이는 기존 빌드 산출물로 되돌리는 동작이며 현재 환경변수로 재빌드하는 것이 아님. 환경변수 설정 복구는 향후 배포를 위해 별도 처리. 도메인·redirect 설정도 별도 확인 |
| 307 전환 후 장애 | 대시보드 규칙이면 그 규칙 해제. 코드 규칙이면 C 직전 정상 배포(B)를 재지정하거나 규칙 제거 배포. 구 주소 직접 서빙 복구를 실제 확인. 새 주소를 이미 사용하는 스토어/앱은 DNS 또는 새 사이트 복구도 필요 |
| www redirect 루프 | 설정을 한 곳으로 통일, apex 직접 서빙 확인 |
| AdMob 검증 지연/실패 | 파일/스토어 웹사이트/robots·보호 정책 확인, 구 파일 계속 접근 가능하게 유지 |
| OAuth 브랜드 검증 문제 | 기록한 기존 공개 URL 및 검증 상태를 기준으로 대응. 콜백·클라이언트 ID를 임의 변경하지 않음 |
| 후속 API 전환 앱에서 새 도메인 장애 | 출시 중단 + DNS/도메인 복구. 구 API가 살아 있어도 이미 새 주소에 묶인 앱이 자동 복구되지는 않음 |

완료는 두 단계로 기록한다. **웹 전환 완료**는 B/C의 접근·호환성·복구 검증 통과이며, **후속 정리 완료**는 편집 가능한 외부 URL과 다음 정규 앱 릴리스, 필요 시 영구 redirect 전환까지 끝난 상태다. 아직 새 앱을 릴리스하지 않았다는 이유로 웹 전환을 실패로 표시하지 않는다.

최종 합격 체크:

- [ ] 두 공용 resolver 및 실제 권위 NS에서 기대 DNS 응답. IPv4/IPv6 충돌 없음, TLS 정상.
- [ ] 새 도메인 6개 공개 페이지와 app-ads.txt 정상. www/구 호스트 경로 보존.
- [ ] `/` 언어 분기·쿠키 우선순위·쿼리 보존, `/policy#terms` 실브라우저 확인.
- [ ] 세 언어 메타데이터 및 정책/지원/삭제 페이지 canonical이 새 도메인.
- [ ] 구버전 앱 공개 링크, 신규 앱 직접 링크 모두 확인. 인증/계정/기능 API 회귀 없음.
- [ ] 스토어·소셜 공개 URL 변경 내역 및 AdMob 검증 결과 기록.
- [ ] 모니터링·갱신 관리·복구 담당/절차 기록. 구 주소 유지.

## 6. 이번 조사에서 하지 않은 검증

가비아/Vercel/스토어/OAuth 로그인 콘솔을 열어 현재 설정을 확인하거나 변경하지 않았다. 실제 플랜, DNS zone, 배포 브랜치, OAuth 검증 상태, 스토어 URL은 미확인이다. 새 도메인 TLS/브라우저, 실토큰 API, 실기기 및 새 빌드 테스트도 아직 수행하지 않았다. 제품 코드를 수정하지 않았으므로 이 계획 단계에서는 앱 전체 테스트나 실제 제품 빌드를 실행하지 않았다. 재검토에서는 별도 임시 Next.js 앱으로 아래의 로컬 HTTP 실험만 수행했다.

이번에 수행한 3회 검증은 코드 대조, 공개 DNS·HTTP 실측, 공식 문서·실패 시나리오 교차 검토다. 배포 후 합격 체크를 이미 통과했다는 뜻이 아니다.

## 7. 공식 근거

- [Dart HttpClientRequest.followRedirects](https://api.dart.dev/dart-io/HttpClientRequest/followRedirects.html): 메서드 제한, 다른 도메인으로 이동할 때 민감 헤더 제거.
- [Vercel 도메인 연결·리다이렉트](https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting): Production 연결, www/apex, 일반 도메인 리다이렉트.
- [Vercel 도메인 문제 해결](https://vercel.com/docs/domains/troubleshooting): DNS·TLS·CAA.
- [Vercel Hobby 약관](https://vercel.com/legal/terms): 개인/비상업 용도 제한. 트래픽 한도와 용도 제한은 별개.
- [Google AdMob app-ads.txt](https://support.google.com/admob/answer/9363762?hl=en): 스토어 개발자 웹사이트와 파일 발견·검증.
- [Google ads.txt/app-ads.txt 크롤링](https://support.google.com/admanager/answer/7673979?hl=en): 도메인 내/외 리다이렉트 구분.
- [Google OAuth 브랜드 검증 요건](https://support.google.com/cloud/answer/13464321?hl=en), [브랜딩 관리](https://support.google.com/cloud/answer/15549049?hl=en): 도메인 소유권·브랜드 정보 변경.
- [Apple 단계적 출시](https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases): 자동 업데이트 분산, 수동 다운로드 가능, 중단의 범위.


## 8. 사용자 요청에 따른 추가 재검증 기록

같은 내용을 반복해서 읽는 대신 세 가지 독립적인 관점으로 다시 확인했다. 외부 변경은 하지 않았다.

### 재검증 1 — 실행 순서와 범위

- 사용자 확인을 반영해 구매 후 미설정을 초기 상태로 정의했다. DNS 정상 응답을 레코드 생성 전 조건으로 두었던 모순을 제거했다.
- 새 도메인 웹 배포(B)와 구 주소 redirect(C)를 분리했다. C를 먼저 배포하는 경로를 없앴다.
- Production 환경변수 설정 → 새 빌드 순서를 명시했다.
- 모노레포의 API 동반 배포 가능성을 추가했다. 실제 배포 생략 설정은 콘솔 확인 항목으로 남겼다.
- UTM·canonical 보강과 선택적인 robots/sitemap을 사이트 연결 자체의 필수 요건과 구분했다.

### 재검증 2 — 현재 Next.js로 제안 규칙 실행

설치된 Next.js **15.5.19**로, 제품 소스 변경 없이 다음을 실행했다.

| 시험 | 결과 | 증명하는 범위 |
|---|---|---|
| 임시 Next 개발 서버, 8개 경로 × 쿼리 유/무 | 16/16 통과 | 307, 새 host, 경로, UTM·공백·반복 query 값 보존 |
| Next config 시험 도구, 새/www/API/dev/Preview/유사 이름 host | 6/6 통과 | 이스케이프한 구 host 규칙이 다른 host에 매칭되지 않음 |
| NextRequest URL 복사 후 언어별 pathname 변경 | 3/3 통과 | ko/en/ja 경로 변경 시 UTM·반복 query 값 유지 |
| 이스케이프하지 않은 host 패턴 반례 | 오매칭 재현 | 점을 정규식 wildcard로 해석하므로 정확한 패턴 필요 |

처음 config 시험 도구에서는 `tag=1&tag=2`가 `tag=1,2`로 보이는 실패가 있었다. 이를 제품 버그로 단정하지 않고 동일 설정의 **실제 임시 HTTP 서버**에서 재시험했다. 실제 응답은 두 값을 보존했고 16개 케이스가 통과했다. 도구의 query 직렬화 경로와 실제 서버 경로가 다르므로 배포 후 검증도 실제 HTTP 응답을 기준으로 한다.

총 25개 긍정/비매칭 검증과 1개 오매칭 반례를 확인했다. 이 숫자는 브라우저·Vercel·TLS·앱 통합 검증을 포함하지 않는다. 임시 서버는 종료했고 생성한 임시 프로젝트도 제거했다.

### 재검증 3 — 외부 서비스와 실패 복구

- 공식 AdMob 문서에서 iOS 발견 기준이 Marketing URL임을 재확인했다. 다음 앱 버전까지 변경이 미뤄지는 경우를 후속 완료로 분리했다.
- 앱의 정책/지원 링크는 외부 브라우저를 여는 코드임을 재확인했다. HTTPS 링크 변경만으로 앱 인증 callback scheme이나 API 주소를 변경할 이유가 없다.
- 롤백은 기존 빌드 선택, 환경변수 설정, 도메인 redirect 세 층으로 구분했다. 대시보드 규칙 해제와 코드 규칙 제거는 복구 방법이 다르다.
- 307/308, HTTPS 전환, trailing slash에 따른 홉 수를 구분했다. 모든 URL이 무조건 1홉이라는 조건을 제거했다.
- 설치된 앱이 한 번도 깨지지 않는다는 절대 보장은 할 수 없다. 다만 이번 변경에서 API·인증 환경을 유지하고 구 공개 링크를 보존하는 방식으로 직접적인 변경 위험을 제한한다.

**재검토 결론:** 공개 사이트 먼저 이전한다는 방향은 유지한다. 설계상 순서 모순과 누락은 위와 같이 수정했다. 실행 전 남은 사항은 가비아/Vercel 실제 설정, 배포 SHA, OAuth·스토어 편집 상태 확인이며, 실행 후 DNS/TLS·브라우저·실기기 검증을 대체하지 않는다.

추가 공식 근거:

- [Next.js redirects](https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects): host 조건, 임시 redirect, query 전달.
- [Vercel 모노레포](https://vercel.com/docs/monorepos): 프로젝트별 배포와 변경 없는 프로젝트 생략.
- [Vercel Instant Rollback](https://vercel.com/docs/instant-rollback): 기존 배포 산출물로 롤백, 환경변수 재빌드와의 차이.
- [Apple 버전 정보](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information/): Support/Marketing URL과 현지화.
- [가비아 DNS 관리](https://dns.gabia.com/): DNS 설정과 포워딩·파킹 구분.


## 9. 실행 기록 — 2026-09-18

- 사용자 승인으로 실행 시작. 사용자 결정에 따라 Vercel Hobby 유지(상업 용도 조건에 대한 유의점 안내 완료). 요금제 변경 없음.
- 가비아: becappy.io Active, 만료일 2027-09-16. 네임서버 ns.gabia.co.kr / ns1.gabia.co.kr / ns.gabia.net. DNSSEC 항목 없음. 자동갱신 상태는 아직 미확인.
- Vercel frontend: Root Directory frontend, Production main, 기존 정상 배포 BEpVxBuTG5rAkgPPrqj4iKktv2HQ, SHA b59e639. 변경 없는 배포 생략 Enabled, Ignored Build Step Automatic, Node 24.x.
- Vercel에 becappy.io Production 별칭 추가 완료. www.becappy.io → becappy.io 307 추가 완료. 기존 moly-server-frontend.vercel.app은 Production 직접 서빙 유지.
- Vercel 지정 DNS: A @ = 216.198.79.1, CNAME www = 01764a55ac88d84a.vercel-dns-017.com. 가비아 레코드 2개 저장 완료(TTL 600). 권위 NS와 Google/Cloudflare 조회 모두 정상. apex HTTPS 200, www HTTPS 307 → apex 확인.
- 로컬 브랜치 feat/becappy-public-domain에서 웹 코드 준비: 공통 SITE_URL, 공개 페이지 canonical 3개, 언어 redirect query 보존, 아키텍처 정정. 기존 host redirect 코드는 아직 추가하지 않음.
- npm run lint / npm run build / npm run typecheck 통과. Production 빌드를 로컬 3107 포트로 실행해 6개 페이지 canonical, 언어·쿠키·반복 query 3개, app-ads.txt 내용/타입 확인 통과.
- 아직 코드 push/Production 배포, 기존 host redirect, 스토어/OAuth/SNS 변경은 수행하지 않음.

- Production NEXT_PUBLIC_SITE_URL=https://becappy.io 신규 Config 변수 저장 완료(기존 값 없음). 재배포 전이므로 기존 빌드에는 아직 미반영.
