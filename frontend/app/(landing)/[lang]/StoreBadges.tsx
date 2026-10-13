import Image from "next/image";

import type { LandingContent } from "./content";
import styles from "./landing.module.css";

/** App Store, Google Play 공식 배지. 페이지 언어의 스토어 페이지로 연결한다. */
export default function StoreBadges({
  c,
  className,
}: {
  c: LandingContent;
  className?: string;
}) {
  return (
    <div className={className ? `${styles.badges} ${className}` : styles.badges} data-nosnippet>
      <a
        className={styles.badge}
        href={c.storeLinks.appStore}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Image
          src={c.badgeImages.appStore}
          alt={c.badges.appStoreAlt}
          className={styles.badgeImage}
          sizes="200px"
        />
      </a>
      <a
        className={styles.badge}
        href={c.storeLinks.play}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Image
          src={c.badgeImages.play}
          alt={c.badges.playAlt}
          className={styles.badgeImage}
          sizes="200px"
        />
      </a>
    </div>
  );
}
