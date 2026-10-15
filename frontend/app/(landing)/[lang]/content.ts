/*
 * 랜딩(`/[lang]`)의 언어별 문구, 이미지, 스토어 링크를 모으는 곳.
 *
 * - 문구: `copy/ko.ts`, `copy/en.ts`, `copy/ja.ts` (모양은 `copy/types.ts`)
 * - 이미지: `images/landing/`. 언어마다 다른 앱 화면 캡처는 `<lang>/`, 캐피 그림은
 *   `art/`에 있다. app-store-design(App Store 스크린샷 작업 폴더)에서 가져왔다.
 */
import type { StaticImageData } from "next/image";

import type { Lang } from "@/lib/lang";

import birdHello from "@/images/landing/art/bird-hello.webp";
import cappyFront from "@/images/landing/art/cappy-front.png";
import appstoreEn from "@/images/landing/badges/appstore_en.png";
import appstoreJa from "@/images/landing/badges/appstore_ja.png";
import appstoreKo from "@/images/landing/badges/appstore_ko.png";
import playEn from "@/images/landing/badges/play_en.png";
import playJa from "@/images/landing/badges/play_ja.png";
import playKo from "@/images/landing/badges/play_ko.png";
import enChat from "@/images/landing/en/chat.webp";
import enJournal from "@/images/landing/en/journal.webp";
import enMood from "@/images/landing/en/mood.webp";
import enRoutine from "@/images/landing/en/routine.webp";
import enShop from "@/images/landing/en/shop.webp";
import jaChat from "@/images/landing/ja/chat.webp";
import jaJournal from "@/images/landing/ja/journal.webp";
import jaMood from "@/images/landing/ja/mood.webp";
import jaRoutine from "@/images/landing/ja/routine.webp";
import jaShop from "@/images/landing/ja/shop.webp";
import koChat from "@/images/landing/ko/chat.webp";
import koJournal from "@/images/landing/ko/journal.webp";
import koMood from "@/images/landing/ko/mood.webp";
import koRoutine from "@/images/landing/ko/routine.webp";
import koShop from "@/images/landing/ko/shop.webp";

import { en } from "./copy/en";
import { ja } from "./copy/ja";
import { ko } from "./copy/ko";
import type { FeatureId, LandingCopy } from "./copy/types";

/* 언어 목록과 판별은 미들웨어와 함께 써야 해서 `lib/lang.ts`에 있다. */
export { DEFAULT_LANG, LANG_COOKIE, LANGS, isLang } from "@/lib/lang";
export type { Lang } from "@/lib/lang";
export type { Heading } from "./copy/types";

/** App Store 앱 ID. 스마트 앱 배너와 구조화 데이터에서 쓴다. */
export const APP_STORE_ID = "6784125709";
/** Google Play 패키지 이름. */
export const PLAY_PACKAGE = "com.geniusjun.moly";

export type LandingContent = LandingCopy & {
  /** 페이지 언어에 맞는 스토어 웹 소개로 연결한다. */
  storeLinks: { appStore: string; play: string };
  badgeImages: { appStore: StaticImageData; play: StaticImageData };
  /** 기능 섹션의 앱 화면 캡처(상단 상태 표시줄 영역을 자른 900px 폭). */
  screens: Record<FeatureId, StaticImageData>;
};

/** 언어와 상관없는 그림: 히어로의 캐피, 배지 위에 앉은 새. */
export const ART = { cappyFront, birdHello };

export const CONTENT: Record<Lang, LandingContent> = {
  ko: {
    ...ko,
    /*
     * App Store는 ko→`/kr`+`l=ko`, en→`/us`+`l=en-US`, ja→`/jp`+`l=ja`로 연결하고
     * 기존 캠페인 파라미터(`pt`, `ct`, `mt`)를 보존한다. Google Play는 `hl`로
     * 웹 표시 언어를 지정한다.
     */
    storeLinks: {
      appStore: `https://apps.apple.com/kr/app/id${APP_STORE_ID}?l=ko&pt=129069274&ct=page&mt=8`,
      play: `https://play.google.com/store/apps/details?id=${PLAY_PACKAGE}&hl=ko`,
    },
    badgeImages: { appStore: appstoreKo, play: playKo },
    screens: { routine: koRoutine, chat: koChat, journal: koJournal, mood: koMood, shop: koShop },
  },
  en: {
    ...en,
    storeLinks: {
      appStore: `https://apps.apple.com/us/app/id${APP_STORE_ID}?l=en-US&pt=129069274&ct=page&mt=8`,
      play: `https://play.google.com/store/apps/details?id=${PLAY_PACKAGE}&hl=en`,
    },
    badgeImages: { appStore: appstoreEn, play: playEn },
    screens: { routine: enRoutine, chat: enChat, journal: enJournal, mood: enMood, shop: enShop },
  },
  ja: {
    ...ja,
    storeLinks: {
      appStore: `https://apps.apple.com/jp/app/id${APP_STORE_ID}?l=ja&pt=129069274&ct=page&mt=8`,
      play: `https://play.google.com/store/apps/details?id=${PLAY_PACKAGE}&hl=ja`,
    },
    badgeImages: { appStore: appstoreJa, play: playJa },
    screens: { routine: jaRoutine, chat: jaChat, journal: jaJournal, mood: jaMood, shop: jaShop },
  },
};
