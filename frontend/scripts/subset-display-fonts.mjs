#!/usr/bin/env node
/*
 * 랜딩 제목 서체를 랜딩 문구에 쓰인 글자만 남겨 서브셋한다. `npm run fonts`
 *
 * - ko/en: 여기어때 잘난체2 (GC COMPANY, 무료 배포와 수정 허용). App Store 스크린샷 제목 서체
 * - ja:    M PLUS Rounded 1c Black (SIL OFL 1.1)
 *
 * 원본(각 3~4MB)은 레포에 넣지 않는다. `design/assets/fonts/`(git 미추적)에 두고
 * 실행하면 `public/fonts/<이름>.<해시>.woff2`와 `app/(landing)/[lang]/display-fonts.ts`
 * 를 다시 쓴다. 파일 이름에 내용 해시가 들어가므로 `next.config.ts`가 `/fonts/*`를
 * immutable로 캐시한다.
 *
 * 문구(`app/(landing)/[lang]/copy/*.ts`)를 고친 뒤에는 꼭 다시 실행해야 한다.
 * 그러지 않으면 새로 생긴 글자만 대체 서체로 튄다.
 */
import { createHash } from "node:crypto";
import { readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import subsetFont from "subset-font";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COPY_DIR = path.join(ROOT, "app/(landing)/[lang]/copy");
const SOURCE_DIR = process.env.DISPLAY_FONT_DIR ?? path.join(ROOT, "design/assets/fonts");
const OUT_DIR = path.join(ROOT, "public/fonts");
const MODULE = path.join(ROOT, "app/(landing)/[lang]/display-fonts.ts");

/** 문구 파일 밖에서 그려질 수 있는 기본 글자(숫자, 문장부호, 따옴표 등). */
const BASE =
  " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~" +
  " ‘’“”–—…→©";

const FONTS = [
  {
    key: "jalnan",
    family: "Jalnan2 Landing",
    file: "Jalnan2TTF.ttf",
    out: "jalnan2",
    copy: ["ko.ts", "en.ts", "shared.ts"],
  },
  {
    key: "mplus",
    family: "M PLUS Rounded 1c Landing",
    file: "MPLUSRounded1c-Black.ttf",
    out: "mplus-rounded-1c-black",
    copy: ["ja.ts", "shared.ts"],
    extra: "、。「」『』（）！？〜ー",
  },
];

const fonts = {};
for (const font of FONTS) {
  const text = (
    await Promise.all(font.copy.map((f) => readFile(path.join(COPY_DIR, f), "utf8")))
  ).join("");
  const chars = [...new Set(BASE + (font.extra ?? "") + text)].join("");

  const source = await readFile(path.join(SOURCE_DIR, font.file)).catch(() => {
    throw new Error(
      `${font.file}이(가) ${SOURCE_DIR}에 없습니다. app-store-design/fonts에서 복사하거나 DISPLAY_FONT_DIR을 지정하세요.`,
    );
  });
  const woff2 = await subsetFont(source, chars, { targetFormat: "woff2" });
  const hash = createHash("sha256").update(woff2).digest("hex").slice(0, 10);
  const name = `${font.out}.${hash}.woff2`;

  // 이전 해시의 파일은 지운다.
  for (const old of await readdir(OUT_DIR).catch(() => [])) {
    if (old.startsWith(`${font.out}.`) && old !== name) await rm(path.join(OUT_DIR, old));
  }
  await writeFile(path.join(OUT_DIR, name), woff2);
  fonts[font.key] = { family: font.family, src: `/fonts/${name}` };
  console.log(`${name}  ${[...chars].length} glyphs  ${(woff2.length / 1024).toFixed(1)}KB`);
}

await writeFile(
  MODULE,
  `/* 생성 파일 — \`npm run fonts\`(scripts/subset-display-fonts.mjs)가 쓴다. 직접 고치지 말 것. */
export const DISPLAY_FONTS = ${JSON.stringify(fonts, null, 2)} as const;
`,
);
