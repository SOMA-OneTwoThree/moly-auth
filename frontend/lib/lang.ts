/*
 * 랜딩 언어의 최소 정의. **이미지나 무거운 의존성을 import 하지 않는다** —
 * Edge 런타임에서 도는 `middleware.ts`가 이 파일을 그대로 가져다 쓰기 때문이다.
 * 언어별 카피·에셋은 `app/[lang]/content.ts`에 있다.
 */
export const LANGS = ["ko", "en", "ja"] as const;
export type Lang = (typeof LANGS)[number];

/** `/` 로 들어왔고 Accept-Language로도 판별이 안 될 때의 기본 언어. */
export const DEFAULT_LANG: Lang = "ko";

/** 사용자가 언어 스위치로 **직접 고른** 언어를 기억하는 쿠키. */
export const LANG_COOKIE = "becappy-lang";

export function isLang(value: string | undefined | null): value is Lang {
  return !!value && (LANGS as readonly string[]).includes(value);
}

/**
 * Accept-Language 헤더에서 지원 언어 하나를 고른다.
 * `ko-KR,ko;q=0.9,en-US;q=0.8` 처럼 q값이 붙은 목록을 q 내림차순으로 훑어
 * 첫 번째로 매칭되는 언어를 반환한다. `q=0`은 "받지 않겠다"는 뜻이라 제외하고,
 * `*`를 만나면 그 뒤는 볼 필요가 없으므로 기본 언어로 끝낸다.
 */
export function pickLangFromAcceptLanguage(header: string | null): Lang {
  if (!header) return DEFAULT_LANG;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return {
        tag: tag.trim().toLowerCase(),
        q: q ? Number.parseFloat(q.split("=")[1]) : 1,
      };
    })
    .filter((entry) => entry.tag && Number.isFinite(entry.q) && entry.q > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    if (tag === "*") break;
    const primary = tag.split("-")[0];
    if (isLang(primary)) return primary;
  }

  return DEFAULT_LANG;
}
