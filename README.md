# moly-auth — 모노레포 (backend + frontend)

Moly의 **계정 서버(backend)**(로그인 검증·회원가입 확정·프로필·탈퇴)와 **사업자 정책 안내 페이지(frontend)**를 한 레포에 둔다.

```
moly-auth/
├── backend/    # Next.js 15 계정 API 서버 (Supabase Auth 토큰 검증, Vercel)
└── frontend/   # Next.js 15 최소 앱 (/policy·/support·/account-deletion 공개 페이지)
```

> **상세 문서 (단일 출처)**
> - 🔧 backend: [`backend/docs/ARCHITECTURE.md`](backend/docs/ARCHITECTURE.md) — 인증 모델·엔드포인트·데이터 접근 규칙·env·런북
> - 🖥️ frontend: [`frontend/docs/ARCHITECTURE.md`](frontend/docs/ARCHITECTURE.md) — 라우트·공개 페이지

계정 API의 현재 계약 기준은 `backend/app/**/route.ts`, `backend/lib/account`와 공통 HTTP
처리 코드다. 공유 DB의 canonical DDL은 `moly-backend/db/`가 소유한다.

## 역할 경계 (2026-07-09 확정)

| 서버 | 담당 | 배포 |
|---|---|---|
| **moly-auth backend** (이 레포) | 계정: `GET/PATCH/DELETE /me` · `POST /onboarding` · `GET/PATCH /me/notifications` · `POST /me/push-token`(FCM, ios/android) · `POST /auth/logout` | Vercel `https://moly-server.vercel.app` |
| **moly-backend** | 대화·일기·경제·상점·루틴·구독·광고·배치 워커 | EC2 `https://voice.moly.asia` |

- 로그인 자체는 iOS의 Supabase SDK(소셜 전용) — 서버는 Bearer 토큰 **검증만**.
- 가입 시 `auth.users → public.profiles` 자동 생성은 DB 트리거(`handle_new_user`) + 이 서버의 self-heal이 담당.
- **DB 스키마(DDL)는 `moly-backend/db/`가 단일 출처** — 이 레포에 마이그레이션 없음. 두 서버는 같은 Supabase 프로젝트를 본다.

## 개발

```bash
cd backend
npm install
npm run typecheck && npm run lint && npm test   # 검증 3종
npm run dev                                      # 로컬 (.env.local: SUPABASE_URL/ANON/SERVICE_ROLE)
```

Google OAuth → Authorized redirect URIs에는 Supabase 콜백만: `https://<project-ref>.supabase.co/auth/v1/callback`.
