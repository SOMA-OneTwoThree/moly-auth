import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import cappyLying from "@/images/landing/cappy-lying.png";
import logo from "@/images/landing/logo.png";

import {
  APP_STORE_URL,
  CONTENT,
  LANGS,
  PLAY_STORE_URL,
  isLang,
  type Lang,
} from "./content";
import LangSwitcher from "./LangSwitcher";
import styles from "./landing.module.css";

/* 워드마크 전용 디스플레이 서체. 디자인의 `font-display` = Quicksand 700. */
const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
  variable: "--font-quicksand",
});

/*
 * 배포 도메인. 커스텀 도메인으로 옮길 때는 NEXT_PUBLIC_SITE_URL만 바꾸면 된다.
 * 빌드 타임에 인라인되므로 배포 환경에 설정해야 반영된다.
 */
const SITE_URL = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://moly-server-frontend.vercel.app",
);

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};

  const c = CONTENT[lang];
  return {
    /*
     * hreflang과 og:url은 **절대 URL이어야만** 검색엔진·공유 카드가 인식한다.
     * metadataBase가 있어야 아래 상대경로들이 절대 URL로 직렬화된다.
     */
    metadataBase: SITE_URL,
    title: c.meta.title,
    description: c.meta.description,
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
      title: c.meta.title,
      description: c.meta.description,
      url: `/${lang}`,
      siteName: "BeCappy",
      locale: c.ogLocale,
      alternateLocale: LANGS.filter((l) => l !== lang).map(
        (l) => CONTENT[l].ogLocale,
      ),
      type: "website",
    },
  };
}

export default async function LandingPage({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const c = CONTENT[lang];

  return (
    <div className={`${styles.page} ${quicksand.variable}`} data-lang={lang}>
      {/* Pretendard는 동적 서브셋(CDN) — 자체 호스팅 시 웨이트당 ~720KB라 과하다. */}
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
      <link rel="stylesheet" href={pretendardHref(lang)} />

      <header className={styles.nav}>
        <Link href={`/${lang}`} className={styles.brand} aria-label="BeCappy">
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
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.wordmarkStack}>
            <span className={styles.wordmarkBig}>BeCappy</span>
            <Image
              src={cappyLying}
              alt=""
              className={styles.cappyLying}
              priority
            />
          </div>

          <p className={styles.tagline}>{c.tagline}</p>

          <div className={styles.badges}>
            <a
              className={styles.badge}
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src={c.badges.appStore}
                alt={c.badges.appStoreAlt}
                className={styles.badgeImage}
              />
            </a>
            <a
              className={styles.badge}
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src={c.badges.play}
                alt={c.badges.playAlt}
                className={styles.badgeImage}
              />
            </a>
          </div>
        </section>

        <section className={styles.features}>
          <ul className={styles.featureRow}>
            {c.shots.map((shot, i) => (
              <li key={i} className={styles.shot}>
                <Image
                  src={shot}
                  alt={c.shotAlt(i + 1)}
                  className={styles.shotImage}
                  sizes="(max-width: 1023px) 240px, (max-width: 1440px) 20vw, 264px"
                />
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className={styles.footer}>
        <span className={styles.footerWordmark}>BeCappy</span>
        <a
          className={styles.footerLink}
          href={c.instagram.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {c.instagram.label}
        </a>
        <nav className={styles.footerLinks}>
          {c.footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className={styles.footerLink}>
              {link.label}
            </Link>
          ))}
        </nav>
        <p className={styles.footerBusiness}>{c.businessInfo}</p>
        <p className={styles.footerCopyright}>{c.copyright}</p>
      </footer>
    </div>
  );
}

const PRETENDARD_VERSION = "v1.3.9";

/** ja는 일본어 자형이 다른 Pretendard JP를 쓴다(디자인의 `font-head`/`font-body` 분기). */
function pretendardHref(lang: Lang) {
  const file =
    lang === "ja"
      ? "pretendardvariable-jp-dynamic-subset.min.css"
      : "pretendardvariable-dynamic-subset.min.css";
  return `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@${PRETENDARD_VERSION}/dist/web/variable/${file}`;
}
