import Image, { type StaticImageData } from "next/image";

import styles from "./landing.module.css";

/**
 * App Store 스크린샷과 같은 폰 프레임(짙은 갈색 테두리, 둥근 화면)에 앱 캡처를
 * 넣는다. 위치는 `className`으로, 폭은 부모(`.panel`) 폭 기준 `--pw`로 정한다.
 */
export default function Phone({
  src,
  alt,
  className,
  sizes,
  priority,
}: {
  src: StaticImageData;
  alt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <div className={className ? `${styles.phone} ${className}` : styles.phone}>
      <div className={styles.phoneScreen}>
        <Image
          src={src}
          alt={alt}
          sizes={sizes}
          quality={82}
          className={styles.phoneImage}
          priority={priority}
        />
      </div>
    </div>
  );
}
