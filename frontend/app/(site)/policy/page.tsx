import { readFile } from "fs/promises";
import path from "path";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./policy.module.css";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Privacy Policy & Terms of Service | BeCappy",
  description: "Privacy Policy and Terms of Service for the BeCappy app.",
};

const TERMS_HEADING = "# Terms of Service";

async function loadPolicy(): Promise<{ privacy: string; terms: string }> {
  const raw = await readFile(
    path.join(process.cwd(), "docs/policy.md"),
    "utf-8"
  );
  const [privacy, ...rest] = raw.split(`\n${TERMS_HEADING}`);
  const terms = rest.length ? `${TERMS_HEADING}${rest.join(`\n${TERMS_HEADING}`)}` : "";
  return { privacy: privacy.trim(), terms: terms.trim() };
}

export default async function PolicyPage() {
  const { privacy, terms } = await loadPolicy();

  return (
    <main className={styles.doc}>
      <nav className={styles.nav} aria-label="Document shortcuts">
        <a href="#privacy">Privacy Policy</a>
        <a href="#terms">Terms of Service</a>
      </nav>

      <section id="privacy">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{privacy}</ReactMarkdown>
      </section>

      {terms && (
        <section id="terms">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{terms}</ReactMarkdown>
        </section>
      )}
    </main>
  );
}
