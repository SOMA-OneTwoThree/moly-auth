"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { CONTENT, LANG_COOKIE, LANGS, type Lang } from "./content";
import styles from "./landing.module.css";

/**
 * 네비게이션 우측의 언어 pill. 닫힌 모습은 DESIGN.pen의 `Lang Switch`
 * (globe · 현재 언어 · chevron)를 그대로 따르고, 열면 나머지 언어로 이동하는
 * 링크 메뉴가 나온다.
 */
export default function LangSwitcher({ current }: { current: Lang }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.langSwitch} ref={rootRef}>
      <button
        type="button"
        className={styles.langPill}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={CONTENT[current].langSwitchLabel}
        onClick={() => setOpen((v) => !v)}
      >
        <GlobeIcon />
        <span className={styles.langCurrent}>{CONTENT[current].langLabel}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <ul className={styles.langMenu} role="menu">
          {LANGS.map((lang) => (
            <li key={lang} role="none">
              <Link
                role="menuitem"
                href={`/${lang}`}
                hrefLang={lang}
                lang={CONTENT[lang].htmlLang}
                aria-current={lang === current ? "true" : undefined}
                className={
                  lang === current
                    ? `${styles.langOption} ${styles.langOptionActive}`
                    : styles.langOption
                }
                onClick={() => {
                  rememberLang(lang);
                  setOpen(false);
                }}
              >
                {CONTENT[lang].langLabel}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * 사용자가 **직접 고른** 언어를 기억한다. 이후 `/`로 들어오면 미들웨어가
 * Accept-Language보다 이 쿠키를 우선해서, 한 번 고른 언어가 유지된다.
 */
function rememberLang(lang: Lang) {
  const secure = location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax${secure}`;
}

/* lucide `globe` / `chevron-down` — 아이콘 하나씩 쓰자고 의존성을 더하지 않는다. */
function GlobeIcon() {
  return (
    <svg
      className={styles.langGlobe}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={open ? `${styles.langChevron} ${styles.langChevronOpen}` : styles.langChevron}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
