/*
 * 랜딩(`/[lang]`)의 언어별 카피·링크·에셋 단일 출처. design/DESIGN.pen의
 * `Landing — 한국어/English/日本語` 프레임과 문서 variables에서 그대로 옮겼다.
 * 문구를 고칠 때는 .pen의 대응 variable도 같이 맞춰 둘 것.
 */
import type { StaticImageData } from "next/image";

import type { Lang } from "@/lib/lang";

import appstoreEn from "@/images/landing/badges/appstore_en.png";
import appstoreJa from "@/images/landing/badges/appstore_ja.png";
import appstoreKo from "@/images/landing/badges/appstore_ko.png";
import playEn from "@/images/landing/badges/play_en.png";
import playJa from "@/images/landing/badges/play_ja.png";
import playKo from "@/images/landing/badges/play_ko.png";
import en1 from "@/images/landing/shots/en_1.png";
import en2 from "@/images/landing/shots/en_2.png";
import en3 from "@/images/landing/shots/en_3.png";
import en4 from "@/images/landing/shots/en_4.png";
import en5 from "@/images/landing/shots/en_5.png";
import ja1 from "@/images/landing/shots/ja_1.png";
import ja2 from "@/images/landing/shots/ja_2.png";
import ja3 from "@/images/landing/shots/ja_3.png";
import ja4 from "@/images/landing/shots/ja_4.png";
import ja5 from "@/images/landing/shots/ja_5.png";
import ko1 from "@/images/landing/shots/ko_1.png";
import ko2 from "@/images/landing/shots/ko_2.png";
import ko3 from "@/images/landing/shots/ko_3.png";
import ko4 from "@/images/landing/shots/ko_4.png";
import ko5 from "@/images/landing/shots/ko_5.png";

/* 언어 목록/판별은 미들웨어와 공유해야 해서 `lib/lang.ts`에 있다. */
export { DEFAULT_LANG, LANG_COOKIE, LANGS, isLang } from "@/lib/lang";
export type { Lang } from "@/lib/lang";

/** 스토어 링크는 언어 공통(단일 링크 운영). */
export const APP_STORE_URL =
  "https://apps.apple.com/app/apple-store/id6784125709?pt=129069274&ct=page&mt=8";
export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.geniusjun.moly";

type FooterLink = { label: string; href: string };

export type LandingContent = {
  /** 언어 스위치 pill에 노출되는 자기 표기(항상 해당 언어로). */
  langLabel: string;
  /** <html>/<div>의 lang 속성 값. */
  htmlLang: string;
  /** Open Graph의 og:locale — `en`이 아니라 `en_US` 형식이어야 한다. */
  ogLocale: string;
  /** 검색 결과 및 브라우저 탭용. 공유 카드 문구와 별도로 관리한다. */
  searchMeta: { title: string; description: string };
  /** 기존 링크 공유 카드 문구. */
  meta: { title: string; description: string };
  tagline: string;
  badges: {
    appStore: StaticImageData;
    appStoreAlt: string;
    play: StaticImageData;
    playAlt: string;
  };
  shots: StaticImageData[];
  shotAlts: string[];
  langSwitchLabel: string;
  instagram: { label: string; href: string };
  footerLinks: FooterLink[];
  /** 푸터 링크 아래 사업자 정보 한 줄. 값은 사업자 등록 서류 기준. */
  businessInfo: string;
  copyright: string;
};

/** 사업자 정보는 ko만 국문 표기, en/ja는 영문 표기를 공유한다. */
const BUSINESS_INFO_KO =
  "대표 : 노창준 · 사업자등록번호 486-49-01105 · 통신판매업신고 제2026-별내-1461호 · Contact nonoeul123@gmail.com";
const BUSINESS_INFO_EN =
  "CEO : Rho Changjun · Business Registration No. 486-49-01105 · Mail Order Business Report 2026-Byeollae-1461 · Contact nonoeul123@gmail.com";
const COPYRIGHT = "© 2026 BeCappy. All rights reserved.";

export const CONTENT: Record<Lang, LandingContent> = {
  ko: {
    langLabel: "한국어",
    htmlLang: "ko",
    ogLocale: "ko_KR",
    searchMeta: {
      title: "BeCappy | AI 친구, 대화, 루틴, 일기, 감정 기록",
      description:
        "카피바라 AI 친구 캐피에게 오늘 하루를 들려주세요. 캐피와 대화하고, 캐피의 일기를 읽고, 오늘의 감정을 기록해보세요. 작은 루틴을 실천하고 캐피를 꾸미며 함께 일상을 만들어가요.",
    },
    meta: {
      title: "BeCappy — 하루의 무게를 덜어주는 느긋한 친구",
      description:
        "별것 아닌 얘기라도 괜찮아요. 캐피는 조언하지 않고, 그냥 들어요.",
    },
    tagline: "하루의 무게를 덜어주는 느긋한 친구",
    badges: {
      appStore: appstoreKo,
      appStoreAlt: "App Store에서 다운로드하기",
      play: playKo,
      playAlt: "Google Play에서 다운로드하기",
    },
    shots: [ko1, ko2, ko3, ko4, ko5],
    shotAlts: [
      "캐피와 함께 자라나는 나의 일상 — 아늑한 방에서 쉬고 있는 카피바라 캐피",
      "오늘 있었던 일과 마음속 이야기를 캐피에게 털어놓는 대화 화면",
      "이불 정리하기와 물 마시기 등 매일의 루틴을 확인하는 화면",
      "캐피의 시선으로 하루를 돌아보는 캐피의 일기",
      "모자와 안경, 목걸이 등 캐피 꾸미기 아이템을 고르는 상점",
    ],
    langSwitchLabel: "언어 선택",
    instagram: {
      label: "Instagram",
      href: "https://www.instagram.com/becappybara",
    },
    footerLinks: [
      { label: "문의", href: "/support" },
      { label: "이용약관", href: "/policy#terms" },
      { label: "개인정보 처리방침", href: "/policy" },
    ],
    businessInfo: BUSINESS_INFO_KO,
    copyright: COPYRIGHT,
  },
  en: {
    langLabel: "English",
    htmlLang: "en",
    ogLocale: "en_US",
    searchMeta: {
      title: "BeCappy | Your Capybara AI Friend for Self-Care",
      description:
        "Share your day with Cappy, your capybara AI friend. Read Cappy’s journal, track your mood, build little routines, and dress up Cappy.",
    },
    meta: {
      title: "BeCappy — An easygoing friend who makes your day feel less heavy",
      description:
        "Even if it's nothing special. Cappy doesn't give advice — Cappy just listens.",
    },
    tagline: "An easygoing friend who makes your day feel less heavy",
    badges: {
      appStore: appstoreEn,
      appStoreAlt: "Download on the App Store",
      play: playEn,
      playAlt: "Get it on Google Play",
    },
    shots: [en1, en2, en3, en4, en5],
    shotAlts: [
      "Grow together with Cappy — your capybara resting in a cozy room",
      "A chat with Cappy about your day and what is on your mind",
      "Daily routines such as making the bed and drinking water",
      "Cappy’s journal reflecting on your day from a friend’s perspective",
      "The shop with hats, glasses, and necklaces to customize Cappy",
    ],
    langSwitchLabel: "Choose a language",
    instagram: {
      label: "Instagram",
      href: "https://www.instagram.com/becappybara_en",
    },
    footerLinks: [
      { label: "Contact Us", href: "/support" },
      { label: "Terms", href: "/policy#terms" },
      { label: "Privacy Policy", href: "/policy" },
    ],
    businessInfo: BUSINESS_INFO_EN,
    copyright: COPYRIGHT,
  },
  ja: {
    langLabel: "日本語",
    htmlLang: "ja",
    ogLocale: "ja_JP",
    searchMeta: {
      title: "BeCappy | カピバラのAI友だちとセルフケア",
      description:
        "カピバラのAI友だち、キャピーに今日のことを話してみませんか。おしゃべりやキャピーの日記、気分の記録で一日を振り返りましょう。小さな習慣を続けながら、着せ替えも楽しめます。",
    },
    meta: {
      title: "BeCappy — 日の重さを軽くしてくれる、のんびり屋の友だち",
      description:
        "何気ない話でも大丈夫。キャピーはアドバイスをしません。ただ聞くだけ。",
    },
    tagline: "日の重さを軽くしてくれる、のんびり屋の友だち",
    badges: {
      appStore: appstoreJa,
      appStoreAlt: "App Store でダウンロード",
      play: playJa,
      playAlt: "Google Play で手に入れよう",
    },
    shots: [ja1, ja2, ja3, ja4, ja5],
    shotAlts: [
      "キャピーと一緒に成長しよう — 居心地のいいお部屋でくつろぐカピバラのキャピー",
      "今日の出来事や気持ちをキャピーに話すチャット画面",
      "布団を整える、水を飲むなど、毎日のルーティンを確認する画面",
      "キャピーの目線で一日を振り返る「キャピーの日記」",
      "帽子やメガネ、ネックレスなど、キャピーの着せ替えアイテムを選ぶショップ",
    ],
    langSwitchLabel: "言語を選択",
    instagram: {
      label: "Instagram",
      href: "https://www.instagram.com/becappybara_jp",
    },
    footerLinks: [
      { label: "お問い合わせ", href: "/support" },
      { label: "利用規約", href: "/policy#terms" },
      { label: "プライバシーポリシー", href: "/policy" },
    ],
    businessInfo: BUSINESS_INFO_EN,
    copyright: COPYRIGHT,
  },
};
