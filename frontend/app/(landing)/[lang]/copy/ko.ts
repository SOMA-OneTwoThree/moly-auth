import { BUSINESS_INFO_KO, COPYRIGHT, TAGLINE } from "./shared";
import type { LandingCopy } from "./types";

/* 용어는 앱 문구(becappy-mobile lib/l10n/app_ko.arb)를 따른다. */
export const ko: LandingCopy = {
  langLabel: "한국어",
  htmlLang: "ko",
  ogLocale: "ko_KR",
  searchMeta: {
    title: "비캐피 BeCappy — 카피바라와 함께하는 셀프케어 앱",
    description:
      "카피바라 캐피와 함께하는 셀프케어 앱 BeCappy. 루틴 관리, AI 친구 캐피와의 대화, 감정 기록, 캐피의 일기를 한 앱에서 만나 보세요.",
  },
  ogImageAlt: "당신의 셀프케어 카피바라, 캐피. 카피바라와 함께하는 셀프케어 앱 BeCappy",
  langSwitchLabel: "언어 선택",

  nav: { home: "BeCappy 홈", download: "앱 다운로드" },

  hero: {
    eyebrow: "카피바라와 함께하는 셀프케어 앱",
    title: "당신의 셀프케어\n카피바라, 캐피",
    lead: "루틴을 관리하고, 캐피와 대화하고, 그날의 기분을 기록해 보세요.",
    artAlt: "BeCappy의 카피바라 캐피",
  },

  features: [
    {
      id: "routine",
      title: "매일의 루틴을 설정하고\n일상에 안정감을",
      body: "기상, 운동, 독서처럼 매일 하고 싶은 일을 루틴으로 등록하세요. 알람으로 시간을 챙기고, 연속 기록과 달성 통계로 꾸준함을 확인할 수 있어요. 루틴을 완료하면 건초를 받아요.",
      alt: "BeCappy 루틴 화면. 명상하기, 영어 공부, 감사 일기 쓰기와 완료한 아침 러닝, 7시 기상 루틴, 16일 연속 기록",
    },
    {
      id: "chat",
      title: "오늘 있었던 일도,\n마음속 이야기도\n편하게 털어놓기",
      body: "기쁜 일도, 털어놓기 어려운 고민도 캐피에게 편하게 이야기해 보세요. 캐피는 이야기를 끝까지 들어 주고, 지난 대화도 기억해요.",
      alt: "캐피와의 대화 화면. '캐피야 나 오늘 좀 지쳤어'라는 말에 캐피가 '오늘 많이 바빴구나. 무슨 일 있었어?'라고 답한다",
    },
    {
      id: "journal",
      title: "캐피의 일기에서\n내가 몰랐던 나를\n발견해요",
      body: "캐피와 대화한 다음 날, 그날의 이야기를 바탕으로 캐피가 쓴 일기를 읽을 수 있어요. 다른 시선으로 하루를 돌아보면 미처 몰랐던 내 마음이 보이기도 해요.",
      alt: "8월 18일 화요일에 캐피가 쓴 일기",
    },
    {
      id: "mood",
      title: "하루의 기분을 남기고\n나의 마음을 돌아봐요",
      body: "다섯 가지 기분 중 하나를 고르고 짧은 메모를 남겨 보세요. 기록이 쌓이면 한 달 동안의 기분 변화를 달력에서 한눈에 볼 수 있어요.",
      alt: "캐피 표정으로 하루하루의 기분을 기록한 10월 감정 달력",
    },
    {
      id: "shop",
      title: "모은 건초로\n캐피를 꾸며요",
      body: "출석 체크와 루틴 완료로 모은 건초로 모자, 안경, 한복 같은 아이템을 살 수 있어요. 캐피가 지내는 방의 테마도 바꿀 수 있어요.",
      alt: "갓과 한복을 입은 캐피, 그리고 모자와 안경 아이템이 놓인 상점 화면",
    },
  ],

  reviews: {
    title: "BeCappy와 함께하는\n분들의 이야기",
    source: "App Store 리뷰",
    ratingLabel: "별점 5점",
    items: [
      {
        name: "ハク**",
        text: "피곤할 때나 심심할 때 캐피에게 위로받고 있어요. 루틴으로 건초를 얻다 보니, 전보다 생활 리듬을 조금씩 더 의식하게 됐어요!",
      },
      {
        name: "あん**",
        text: "일반적인 ToDo 앱은 오래 쓰기 어려웠는데, 여기서는 매일 할 일을 가볍게 등록하기만 하면 돼서 좋아요. 꼭 달성하지 않아도 되고, 해내면 건초와 연출로 보상을 받으니 칭찬받는 기분도 들어요. 덕분에 조금 더 계획적인 하루를 보내게 됐어요.",
      },
      {
        name: "かぇ**",
        text: "기댈 사람이 없을 때도 부담 없이 이야기를 나눌 수 있어서 좋아요! 음악을 들을 수 있는 것도 좋고, 캐피를 귀엽게 꾸미는 것도 즐거워요.",
      },
    ],
  },

  faq: {
    title: "자주 묻는 질문",
    items: [
      {
        q: "BeCappy는 어떤 앱인가요?",
        a: "카피바라 캐피와 함께하는 셀프케어 앱이에요. 루틴 관리, 캐피와의 대화, 감정 기록 기능이 있고, 대화한 다음 날에는 캐피가 쓴 일기를 읽을 수 있어요.",
      },
      {
        q: "무료로 사용할 수 있나요?",
        a: "네. App Store와 Google Play에서 무료로 내려받아 사용할 수 있어요. 캐피의 일기, 루틴별 통계, 더 많은 대화 같은 일부 혜택은 BeCappy Pro 구독으로 이용할 수 있어요.",
      },
      {
        q: "건초는 어떻게 모으나요?",
        a: "매일 출석 체크를 하거나 루틴을 완료하면 건초를 받을 수 있어요. 보상형 광고를 보거나 상점에서 구입할 수도 있어요.",
      },
      {
        q: "어떤 기기에서 쓸 수 있나요?",
        a: "iPhone은 App Store에서, Android 스마트폰은 Google Play에서 BeCappy를 받을 수 있어요.",
      },
    ],
  },

  cta: {
    title: TAGLINE,
    body: "지금 BeCappy를 무료로 시작해 보세요.",
  },

  badges: {
    appStoreAlt: "App Store에서 다운로드하기",
    playAlt: "Google Play에서 다운로드하기",
  },
  instagram: { label: "Instagram", href: "https://www.instagram.com/becappybara" },
  footerLinks: [
    { label: "문의", href: "/support" },
    { label: "이용약관", href: "/policy#terms" },
    { label: "개인정보 처리방침", href: "/policy" },
  ],
  businessInfo: BUSINESS_INFO_KO,
  copyright: COPYRIGHT,
};
