/*
 * 랜딩 문구의 모양. 언어별 문구는 같은 폴더의 ko/en/ja.ts에 있고, 이미지와 스토어
 * 링크를 붙이는 일은 `../content.ts`가 한다.
 *
 * 제목(`Heading`)의 `\n`은 넓은 화면에서의 줄바꿈 위치다. 좁은 화면에서는
 * 자연스럽게 다시 감싼다. 제목 문구는 App Store 스크린샷과 같다.
 *
 * 이 폴더의 파일에는 문구만 둔다. `npm run fonts`가 이 파일들의 글자로 제목 서체를
 * 서브셋하므로, 문구를 고친 뒤에는 꼭 다시 실행해야 새 글자가 다른 서체로 튀지 않는다.
 */

/** `\n` 줄바꿈을 쓸 수 있는 제목 문자열. */
export type Heading = string;

/** 기능 섹션 id. 화면 캡처(content.ts의 `screens`) 키와 같다. */
export type FeatureId = "routine" | "chat" | "journal" | "mood" | "shop";

export type Feature = {
  id: FeatureId;
  title: Heading;
  body: string;
  /** 앱 화면 캡처의 대체 텍스트. 화면이 보여 주는 내용을 그대로 적는다. */
  alt: string;
};

export type FaqItem = { q: string; a: string };

export type LandingCopy = {
  /** 언어 스위치에 노출되는 자기 표기(항상 해당 언어로). */
  langLabel: string;
  /** <html>의 lang 속성 값. */
  htmlLang: string;
  /** Open Graph의 og:locale. `en`이 아니라 `en_US` 형식이어야 한다. */
  ogLocale: string;
  /** 검색 결과, 브라우저 탭, 공유 카드에서 쓰는 소개. */
  searchMeta: { title: string; description: string };
  /** 공유 카드 이미지(public/og/<lang>.png)의 대체 텍스트. */
  ogImageAlt: string;
  langSwitchLabel: string;

  nav: { home: string; download: string };

  hero: {
    eyebrow: string;
    title: Heading;
    lead: string;
    artAlt: string;
  };

  /** 위에서부터 이 순서로 그린다. */
  features: Feature[];

  reviews: {
    title: Heading;
    /** 리뷰 출처 표기. */
    source: string;
    /** 별 다섯 개의 읽기용 텍스트. */
    ratingLabel: string;
    items: { name: string; text: string }[];
  };

  faq: { title: Heading; items: FaqItem[] };

  cta: { title: Heading; body: string };

  badges: { appStoreAlt: string; playAlt: string };
  instagram: { label: string; href: string };
  footerLinks: { label: string; href: string }[];
  /** 푸터의 사업자 정보 한 줄. 값은 사업자 등록 서류 기준. */
  businessInfo: string;
  copyright: string;
};
