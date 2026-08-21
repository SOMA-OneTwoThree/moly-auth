import type { ReactNode } from "react";

import { DEFAULT_LANG, isLang } from "@/lib/lang";

import { CONTENT } from "./content";

/*
 * 랜딩 전용 루트 레이아웃. `(site)` 그룹(policy/support/account-deletion)과
 * **별도의 <html>을 갖기 위해** 라우트 그룹으로 분리했다. 덕분에 `<html lang>`을
 * 실제 언어(ko/en/ja)로 낼 수 있고, 페이지는 그대로 정적 프리렌더된다.
 *
 * 랜딩은 자체 브랜드 톤이라 globals.css(다크 토큰)를 불러오지 않는다 —
 * 배경/글꼴은 landing.module.css가 전부 정의한다.
 */
export default async function LandingLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const htmlLang = isLang(lang)
    ? CONTENT[lang].htmlLang
    : CONTENT[DEFAULT_LANG].htmlLang;

  return (
    <html lang={htmlLang}>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
