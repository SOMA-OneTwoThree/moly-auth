import type { NextConfig } from "next";

/*
 * `/` → 언어별 랜딩 분기는 `middleware.ts`가 담당한다. next.config의
 * `redirects()`는 미들웨어보다 **먼저** 평가되므로, 여기에 `/` 리다이렉트를
 * 두면 Accept-Language 감지가 아예 실행되지 않는다. 다시 추가하지 말 것.
 */
const nextConfig: NextConfig = {
  images: {
    // 랜딩의 앱 화면 캡처는 글자가 많아 기본값(75)보다 조금 높게 쓴다.
    qualities: [75, 82],
  },
  async headers() {
    return [
      {
        // `npm run fonts`가 파일 이름에 내용 해시를 넣으므로 영구 캐시해도 안전하다.
        source: "/fonts/:file*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
