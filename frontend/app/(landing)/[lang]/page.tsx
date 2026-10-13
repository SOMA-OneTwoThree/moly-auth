import type { Metadata, Viewport } from "next";
import { Quicksand } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { preload } from "react-dom";

import logo from "@/images/landing/logo.png";
import { SITE_URL } from "@/lib/site-url";

import { APP_STORE_ID, ART, CONTENT, LANGS, isLang, type Lang } from "./content";
import { DISPLAY_FONTS } from "./display-fonts";
import Heading from "./Heading";
import LangSwitcher from "./LangSwitcher";
import styles from "./landing.module.css";
import Phone from "./Phone";
import StoreBadges from "./StoreBadges";
import { landingJsonLd } from "./structured-data";

/* 워드마크와 태그라인 서체. 앱 로고와 같은 Quicksand 700. */
const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
  variable: "--font-quicksand",
});

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

type Props = { params: Promise<{ lang: string }> };

export const viewport: Viewport = {
  themeColor: "#FAF3E4",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};

  const c = CONTENT[lang];
  const ogImage = {
    url: `/og/${lang}.png`,
    width: 1200,
    height: 630,
    alt: c.ogImageAlt,
  };
  return {
    /*
     * hreflang과 og:url은 **절대 URL이어야만** 검색엔진과 공유 카드가 인식한다.
     * metadataBase가 있어야 아래 상대경로들이 절대 URL로 직렬화된다.
     */
    metadataBase: SITE_URL,
    title: c.searchMeta.title,
    description: c.searchMeta.description,
    applicationName: "BeCappy",
    alternates: {
      canonical: `/${lang}`,
      languages: {
        ko: "/ko",
        en: "/en",
        ja: "/ja",
        // x-default는 언어를 감지해 분기하는 URL을 가리켜야 한다 → 미들웨어가 붙은 `/`.
        "x-default": "/",
      },
    },
    openGraph: {
      title: c.searchMeta.title,
      description: c.searchMeta.description,
      url: `/${lang}`,
      siteName: "BeCappy",
      locale: c.ogLocale,
      alternateLocale: LANGS.filter((l) => l !== lang).map(
        (l) => CONTENT[l].ogLocale,
      ),
      type: "website",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: c.searchMeta.title,
      description: c.searchMeta.description,
      images: [ogImage],
    },
    // iOS Safari의 스마트 앱 배너(설치/열기).
    itunes: { appId: APP_STORE_ID },
    // 푸터의 사업자등록번호가 iOS에서 전화번호 링크로 바뀌지 않게 한다.
    formatDetection: { telephone: false, address: false, email: false },
  };
}

export default async function LandingPage({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const c = CONTENT[lang];
  const font = lang === "ja" ? DISPLAY_FONTS.mplus : DISPLAY_FONTS.jalnan;
  // 제목 서체는 언어마다 하나만 쓰므로 그 파일만 미리 받는다.
  preload(font.src, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });

  const jsonLd = landingJsonLd(
    lang,
    c.features.map((f) => c.screens[f.id].src),
  );

  return (
    <div className={`${styles.page} ${quicksand.variable}`} data-lang={lang}>
      <style href={font.src} precedence="default">
        {`@font-face{font-family:"${font.family}";src:url(${font.src}) format("woff2");font-display:swap}`}
      </style>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      {/* Pretendard는 동적 서브셋(CDN). 자체 호스팅 시 웨이트당 ~720KB라 과하다. */}
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
      <link rel="stylesheet" href={pretendardHref(lang)} />

      <header className={styles.nav}>
        <div className={styles.navInner}>
          <Link href={`/${lang}`} className={styles.brand} aria-label={c.nav.home}>
            <Image
              src={logo}
              alt=""
              width={36}
              height={36}
              className={styles.brandIcon}
              priority
            />
            <span className={styles.brandName}>BeCappy</span>
          </Link>
          <LangSwitcher current={lang} />
          <a href="#download" className={styles.navCta}>
            {c.nav.download}
          </a>
        </div>
      </header>

      <main>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            {/* App Store 첫 장과 같은 기울어진 배지와 그 위에 앉은 새. */}
            <p className={styles.eyebrow}>
              <Image
                src={ART.birdHello}
                alt=""
                className={styles.eyebrowBird}
                sizes="64px"
                priority
              />
              {c.hero.eyebrow}
            </p>
            <h1 id="hero-title" className={styles.heroTitle}>
              <Heading text={c.hero.title} />
            </h1>
            <p className={styles.heroLead}>{c.hero.lead}</p>
            <StoreBadges c={c} className={styles.heroBadges} />
          </div>
          <div className={styles.heroArt}>
            <Image
              src={ART.cappyFront}
              alt={c.hero.artAlt}
              className={styles.heroCappy}
              priority
              unoptimized
            />
          </div>
        </section>

        {c.features.map((feature, i) => (
          <section
            key={feature.id}
            id={feature.id}
            className={styles.feature}
            data-flip={i % 2 === 1 || undefined}
            aria-labelledby={`${feature.id}-title`}
          >
            <div className={styles.featureText}>
              <h2 id={`${feature.id}-title`} className={styles.h2}>
                <Heading text={feature.title} />
              </h2>
              <p className={styles.featureBody}>{feature.body}</p>
            </div>
            <div className={styles.panel}>
              <Phone
                src={c.screens[feature.id]}
                alt={feature.alt}
                className={styles.panelPhone}
                sizes="(min-width: 960px) 300px, 56vw"
              />
            </div>
          </section>
        ))}

        <section className={styles.reviews} aria-labelledby="reviews-title">
          <h2 id="reviews-title" className={`${styles.h2} ${styles.center}`}>
            <Heading text={c.reviews.title} />
          </h2>
          <p className={styles.reviewsSource}>{c.reviews.source}</p>
          <ul className={styles.reviewList}>
            {c.reviews.items.map((review) => (
              <li key={review.name} className={styles.review}>
                <p className={styles.stars} role="img" aria-label={c.reviews.ratingLabel}>
                  ★★★★★
                </p>
                <blockquote className={styles.reviewText}>
                  <p>{review.text}</p>
                </blockquote>
                <p className={styles.reviewName}>{review.name}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.faq} aria-labelledby="faq-title">
          <h2 id="faq-title" className={`${styles.h2} ${styles.center}`}>
            <Heading text={c.faq.title} />
          </h2>
          <div className={styles.faqList}>
            {c.faq.items.map((item) => (
              <details key={item.q} className={styles.faqItem}>
                <summary className={styles.faqQ}>
                  <h3>{item.q}</h3>
                </summary>
                <p className={styles.faqA}>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="download" className={styles.cta} aria-labelledby="cta-title">
          <h2 id="cta-title" className={styles.ctaTitle}>
            <Heading text={c.cta.title} />
          </h2>
          <p className={styles.ctaBody}>{c.cta.body}</p>
          <StoreBadges c={c} />
        </section>
      </main>

      <footer className={styles.footer}>
        <span className={styles.footerWordmark}>BeCappy</span>
        <nav className={styles.footerLinks} aria-label="BeCappy">
          <a href={c.instagram.href} target="_blank" rel="noopener noreferrer">
            {c.instagram.label}
          </a>
          {c.footerLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <p className={styles.footerBusiness}>
          <span data-nosnippet>{c.businessInfo}</span>
        </p>
        <p className={styles.footerCopyright}>
          <span data-nosnippet>{c.copyright}</span>
        </p>
      </footer>
    </div>
  );
}

const PRETENDARD_VERSION = "v1.3.9";

/** ja는 일본어 자형이 다른 Pretendard JP를 쓴다. */
function pretendardHref(lang: Lang) {
  const file =
    lang === "ja"
      ? "pretendardvariable-jp-dynamic-subset.min.css"
      : "pretendardvariable-dynamic-subset.min.css";
  return `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@${PRETENDARD_VERSION}/dist/web/variable/${file}`;
}
