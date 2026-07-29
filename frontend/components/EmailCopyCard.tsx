"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./EmailCopyCard.module.css";

export default function EmailCopyCard({
  email,
  title,
  description,
}: {
  email: string;
  title: string;
  description?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      // clipboard API 미지원 환경(비보안 컨텍스트 등) 폴백
      const textarea = document.createElement("textarea");
      textarea.value = email;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      className={styles.card}
      onClick={handleCopy}
      title="Copy email address"
    >
      <span className={styles.icon} aria-hidden>
        ✉️
      </span>
      <span className={styles.body}>
        <span className={styles.name}>{title}</span>
        <span className={styles.desc}>{description ?? email}</span>
      </span>
      <span
        className={`${styles.copyBadge} ${copied ? styles.copiedBadge : ""}`}
        aria-live="polite"
      >
        {copied ? (
          "Copied ✓"
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </span>
    </button>
  );
}
