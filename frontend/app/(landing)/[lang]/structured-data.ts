import { SITE_URL } from "@/lib/site-url";

import { APP_STORE_ID, CONTENT, LANGS, PLAY_PACKAGE, type Lang } from "./content";

const abs = (path: string) => new URL(path, SITE_URL).href;

const ORGANIZATION_ID = abs("/#organization");
const WEBSITE_ID = abs("/#website");
const APP_ID = abs("/#app");

/** 스토어 가격 표시 통화. 앱 자체는 무료(앱 내 구입 별도)다. */
const CURRENCY: Record<Lang, string> = { ko: "KRW", en: "USD", ja: "JPY" };

/**
 * 랜딩의 JSON-LD. 언어마다 같은 사이트와 팀, 앱을 가리키도록 `@id`를 공유하고,
 * 페이지(WebPage)와 자주 묻는 질문(FAQPage)만 언어별로 다르다.
 *
 * 평점(aggregateRating)은 스토어마다 다르고 계속 바뀌어서 넣지 않는다.
 */
export function landingJsonLd(lang: Lang, screenshots: string[]) {
  const c = CONTENT[lang];
  const pageUrl = abs(`/${lang}`);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: "BeCappy",
        url: SITE_URL.href,
        logo: abs("/icon.png"),
        sameAs: LANGS.map((l) => CONTENT[l].instagram.href),
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: "BeCappy",
        alternateName: "비캐피",
        url: SITE_URL.href,
        publisher: { "@id": ORGANIZATION_ID },
        inLanguage: LANGS.map((l) => CONTENT[l].htmlLang),
      },
      {
        "@type": "MobileApplication",
        "@id": APP_ID,
        name: "BeCappy",
        alternateName: ["비캐피", "BeCappy: Self-care Capybara"],
        description: c.searchMeta.description,
        applicationCategory: "HealthApplication",
        operatingSystem: "iOS, Android",
        image: abs("/icon.png"),
        screenshot: screenshots.map(abs),
        url: pageUrl,
        installUrl: c.storeLinks.appStore,
        sameAs: [
          `https://apps.apple.com/app/id${APP_STORE_ID}`,
          `https://play.google.com/store/apps/details?id=${PLAY_PACKAGE}`,
        ],
        inLanguage: LANGS.map((l) => CONTENT[l].htmlLang),
        offers: { "@type": "Offer", price: 0, priceCurrency: CURRENCY[lang] },
        publisher: { "@id": ORGANIZATION_ID },
      },
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: c.searchMeta.title,
        description: c.searchMeta.description,
        inLanguage: c.htmlLang,
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": APP_ID },
        primaryImageOfPage: abs(`/og/${lang}.png`),
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        inLanguage: c.htmlLang,
        isPartOf: { "@id": `${pageUrl}#webpage` },
        mainEntity: c.faq.items.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };
}
