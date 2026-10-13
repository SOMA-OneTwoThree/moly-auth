import type { MetadataRoute } from "next";

import { LANGS } from "@/lib/lang";
import { SITE_URL } from "@/lib/site-url";

const abs = (path: string) => new URL(path, SITE_URL).href;

export default function sitemap(): MetadataRoute.Sitemap {
  // 언어별 랜딩은 서로를 hreflang 대안으로 알린다(페이지 <head>의 alternates와 같은 값).
  const languages = {
    ...Object.fromEntries(LANGS.map((lang) => [lang, abs(`/${lang}`)])),
    "x-default": abs("/"),
  };

  return [
    ...LANGS.map((lang) => ({
      url: abs(`/${lang}`),
      changeFrequency: "monthly" as const,
      priority: 1,
      alternates: { languages },
    })),
    ...["/policy", "/support", "/account-deletion"].map((path) => ({
      url: abs(path),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
