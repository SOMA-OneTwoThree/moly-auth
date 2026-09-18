/** 정적 페이지의 canonical·공유 URL. 변경 후 재빌드가 필요하다. */
export const SITE_URL = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://becappy.io",
);
