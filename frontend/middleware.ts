import { NextResponse, type NextRequest } from "next/server";

import {
  LANG_COOKIE,
  isLang,
  pickLangFromAcceptLanguage,
} from "@/lib/lang";

/*
 * `/` 로 들어온 요청만 언어별 랜딩으로 넘긴다.
 *
 * matcher가 `/` 하나뿐인 게 핵심이다. `/en`·`/ja` 같이 **명시적으로 언어가 박힌
 * 링크는 절대 건드리지 않으므로**, 공유된 링크나 스토어 등록정보의 URL은 어떤
 * 브라우저에서 열어도 그 언어 그대로 열린다. `/policy` 등 공개 페이지도 그대로다.
 *
 * 우선순위: 사용자가 언어 스위치로 직접 고른 값(쿠키) > Accept-Language > 기본 한국어.
 */
export const config = { matcher: "/" };

export function middleware(request: NextRequest) {
  const chosen = request.cookies.get(LANG_COOKIE)?.value;
  const lang = isLang(chosen)
    ? chosen
    : pickLangFromAcceptLanguage(request.headers.get("accept-language"));

  const response = NextResponse.redirect(new URL(`/${lang}`, request.url), 307);
  // 응답이 요청 헤더/쿠키에 따라 달라지므로, CDN이 한 언어의 리다이렉트를
  // 모두에게 재사용하지 않도록 반드시 알린다.
  response.headers.set("Vary", "Accept-Language, Cookie");
  return response;
}
