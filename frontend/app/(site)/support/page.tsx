import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./support.module.css";
import kakaoIcon from "@/images/kakaotalk.png";
import EmailCopyCard from "@/components/EmailCopyCard";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Support | BeCappy",
  description: "Contact channels and frequently asked questions for the BeCappy app.",
};

const SUPPORT_EMAIL = "nonoeul123@gmail.com";
const KAKAO_CHANNEL_URL = "https://pf.kakao.com/_TshfX";

const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: "How do I get a refund?",
    a: "Refunds for in-app purchases (Hay) are handled by the store you purchased from. On iOS, request a refund at reportaproblem.apple.com; on Android, request one from your order history at play.google.com/store/account.",
  },
  {
    q: "How do I delete my account?",
    a: (
      <>
        Go to Settings &gt; Delete Account in the app. All your data, including
        conversations and diaries, is permanently deleted and can&apos;t be
        recovered. If you can no longer access the app, see the{" "}
        <Link href="/account-deletion">Account Deletion page</Link>.
      </>
    ),
  },
  {
    q: "Is there a limit on daily conversations?",
    a: "There is a daily conversation limit, which resets at 4 AM every day. Once you reach it, you can chat with Cappy again the next day.",
  },
  {
    q: "How do I earn Hay?",
    a: "Check in daily, watch rewarded ads, and complete your routines — or purchase Hay from the shop.",
  },
];

export default function SupportPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>BeCappy Support</h1>
        <p className={styles.lead}>
          Have a question or something not working?
          <br />
          Reach us anytime through the channels below.
        </p>
      </header>

      <section className={styles.channels} aria-label="Contact channels">
        <a
          className={`${styles.channelCard} ${styles.kakaoCard}`}
          href={KAKAO_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            src={kakaoIcon}
            alt=""
            width={44}
            height={44}
            className={styles.channelIcon}
          />
          <span className={styles.channelBody}>
            <span className={styles.channelName}>KakaoTalk Channel</span>
            <span className={styles.channelDesc}>
              1:1 chat — the fastest way to get an answer
            </span>
          </span>
          <span className={styles.channelArrow} aria-hidden>
            ›
          </span>
        </a>

        <EmailCopyCard
          email={SUPPORT_EMAIL}
          title="Email support"
          description={`${SUPPORT_EMAIL} · Replies within 1–3 business days`}
        />
      </section>

      <section aria-label="Frequently asked questions">
        <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
        <ul className={styles.faqList}>
          {FAQ.map((item) => (
            <li key={item.q} className={styles.faqItem}>
              <p className={styles.faqQ}>Q. {item.q}</p>
              <p className={styles.faqA}>{item.a}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
