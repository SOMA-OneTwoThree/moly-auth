import type { Metadata } from "next";
import styles from "./account-deletion.module.css";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Account Deletion | BeCappy",
  description: "How to delete your BeCappy account.",
};

const SUPPORT_EMAIL = "nonoeul123@gmail.com";

const MAILTO_HREF = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
  "BeCappy Account Deletion Request"
)}&body=${encodeURIComponent(
  [
    "I would like to delete my BeCappy account.",
    "",
    "Sign-in provider (Apple / Google / Kakao):",
    "Email address used for sign-in:",
  ].join("\n")
)}`;

export default function AccountDeletionPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Delete Your BeCappy Account</h1>
        <p className={styles.lead}>
          You can delete your account and all of its data at any time.
        </p>
      </header>

      <section className={styles.section} aria-label="Delete in the app">
        <h2 className={styles.sectionTitle}>In the app</h2>
        <div className={styles.card}>
          <ol className={styles.steps}>
            <li>Open BeCappy and sign in.</li>
            <li>
              Go to <strong>Settings &gt; Delete Account</strong>.
            </li>
            <li>Confirm the deletion.</li>
          </ol>
          <p className={styles.note}>
            Deletion is immediate and permanent. Your conversations, diaries,
            routines, Hay, and items are all removed and can&apos;t be
            recovered.
          </p>
        </div>
      </section>

      <section className={styles.section} aria-label="Request deletion by email">
        <h2 className={styles.sectionTitle}>Can&apos;t access the app?</h2>
        <div className={styles.card}>
          <p>
            Email us and we&apos;ll delete your account for you. Please tell us:
          </p>
          <ul className={styles.list}>
            <li>Which sign-in you used (Apple, Google, or Kakao)</li>
            <li>The email address on your account</li>
          </ul>
          <a className={styles.emailButton} href={MAILTO_HREF}>
            <span className={styles.emailIcon} aria-hidden>
              ✉️
            </span>
            <span className={styles.emailBody}>
              <span className={styles.emailName}>Email deletion request</span>
              <span className={styles.emailDesc}>{SUPPORT_EMAIL}</span>
            </span>
          </a>
          <p className={styles.note}>
            We&apos;ll confirm the account is yours and complete the deletion
            within 7 days. For details on how your data is handled, see our{" "}
            <a className={styles.policyLink} href="/policy">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
