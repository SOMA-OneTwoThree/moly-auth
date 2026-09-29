import type { MetadataRoute } from "next";

import { LANGS } from "@/lib/lang";
import { SITE_URL } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    ...LANGS.map((lang) => `/${lang}`),
    "/policy",
    "/support",
    "/account-deletion",
  ];

  return paths.map((path) => ({ url: new URL(path, SITE_URL).href }));
}
