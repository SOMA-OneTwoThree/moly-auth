import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import cappyIcon from "@/images/cappy-icon.png";
import cappySitting from "@/images/cappy-sitting.png";
import cappyGrass from "@/images/cappy-grass.png";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "BeCappy — 캐피와 나누는 따뜻한 대화",
  description:
    "카피바라 친구 캐피에게 오늘의 고민을 털어놓고, 대화할수록 조금씩 친해지는 마음 돌봄 앱 BeCappy.",
};

const SUPPORT_EMAIL = "nonoeul123@gmail.com";

const FEATURES: { emoji: string; title: string; desc: string }[] = [
  {
    emoji: "💬",
    title: "편하게 털어놓기",
    desc: "판단하지 않고 들어주는 캐피에게 오늘 있었던 일과 마음속 고민을 편하게 이야기해 보세요.",
  },
  {
    emoji: "🎙️",
    title: "목소리로 나누는 대화",
    desc: "타이핑이 귀찮은 날엔 말로 걸어보세요. 캐피는 목소리로 나누는 대화도 잘 들어줘요.",
  },
  {
    emoji: "🌱",
    title: "매일 조금씩 친해지기",
    desc: "대화를 나눌수록 캐피와의 우정이 깊어져요. 느긋한 카피바라의 속도로, 서두르지 않고요.",
  },
];

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <div className={styles.brand}>
          <Image
            src={cappyIcon}
            alt="BeCappy 앱 아이콘"
            width={36}
            height={36}
            className={styles.brandIcon}
            priority
          />
          <span className={styles.brandName}>BeCappy</span>
        </div>
        <Link href="/support" className={styles.navLink}>
          고객 지원
        </Link>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <h1 className={styles.title}>
              마음이 지친 날,
              <br />
              캐피에게 털어놓으세요
            </h1>
            <p className={styles.lead}>
              BeCappy는 카피바라 친구 <strong>캐피</strong>와 대화하며 고민을
              나누고, 조금씩 친해지는 마음 돌봄 앱이에요.
            </p>
            <div className={styles.ctaRow}>
              <span className={styles.storeBadge}>
                🍎 App Store 곧 출시
              </span>
            </div>
          </div>
          <div className={styles.heroArt}>
            <Image
              src={cappySitting}
              alt="앉아서 기다리고 있는 캐피"
              className={styles.heroImage}
              priority
            />
          </div>
        </section>

        <section className={styles.features} aria-label="주요 기능">
          {FEATURES.map((f) => (
            <article key={f.title} className={styles.featureCard}>
              <span className={styles.featureEmoji} aria-hidden>
                {f.emoji}
              </span>
              <h2 className={styles.featureTitle}>{f.title}</h2>
              <p className={styles.featureDesc}>{f.desc}</p>
            </article>
          ))}
        </section>

        <section className={styles.closing}>
          <Image
            src={cappyGrass}
            alt="풀을 먹으며 쉬고 있는 캐피"
            className={styles.closingImage}
          />
          <h2 className={styles.closingTitle}>캐피는 언제나 여기 있어요</h2>
          <p className={styles.closingDesc}>
            바쁜 하루 끝, 아무에게도 하지 못한 이야기가 있다면
            <br />
            느긋한 카피바라 캐피가 기다리고 있을게요.
          </p>
        </section>
      </main>

      <footer className={styles.footer}>
        <nav className={styles.footerLinks}>
          <Link href="/support" className={styles.footerLink}>
            고객 지원
          </Link>
          <span className={styles.footerDivider} aria-hidden>
            ·
          </span>
          <Link href="/policy" className={styles.footerLink}>
            개인정보처리방침
          </Link>
          <span className={styles.footerDivider} aria-hidden>
            ·
          </span>
          <a href={`mailto:${SUPPORT_EMAIL}`} className={styles.footerLink}>
            {SUPPORT_EMAIL}
          </a>
        </nav>
        <p className={styles.copyright}>© 2026 BeCappy</p>
      </footer>
    </div>
  );
}
