# moly-auth

Moly(BeCappy)의 **계정 API 서버(backend)**와 **공개 웹 페이지(frontend)** 모노레포.

```
moly-auth/
├── backend/    # Next.js 계정 API (Supabase Auth 토큰 검증, Vercel)
└── frontend/   # 랜딩·/policy·/support·/account-deletion 공개 페이지
```

상세 내용(인증 모델·엔드포인트·env·런북·역할 경계)은 각 패키지의 문서가 단일 출처다.

- backend: [`backend/docs/ARCHITECTURE.md`](backend/docs/ARCHITECTURE.md)
- frontend: [`frontend/docs/ARCHITECTURE.md`](frontend/docs/ARCHITECTURE.md)

## 개발

```bash
cd backend   # 또는 frontend (dev 서버는 3001 포트)
npm install
npm run dev
npm run typecheck && npm run lint && npm test   # 검증 (test는 backend만)
```
