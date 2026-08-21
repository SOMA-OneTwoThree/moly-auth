import type { NextConfig } from "next";

/*
 * `/` → 언어별 랜딩 분기는 `middleware.ts`가 담당한다. next.config의
 * `redirects()`는 미들웨어보다 **먼저** 평가되므로, 여기에 `/` 리다이렉트를
 * 두면 Accept-Language 감지가 아예 실행되지 않는다. 다시 추가하지 말 것.
 */
const nextConfig: NextConfig = {};

export default nextConfig;
