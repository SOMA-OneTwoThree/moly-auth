import { BUSINESS_INFO_EN, COPYRIGHT, TAGLINE } from "./shared";
import type { LandingCopy } from "./types";

/* Terms follow the app (becappy-mobile lib/l10n/app_en.arb). */
export const en: LandingCopy = {
  langLabel: "English",
  htmlLang: "en",
  ogLocale: "en_US",
  searchMeta: {
    title: "BeCappy: Self-care Capybara — Chat, Habit Tracker, Journal",
    description:
      "BeCappy is a self-care app with Cappy the capybara. Manage your routines, chat with your AI friend Cappy, log your mood and read Cappy's journal, all in one app.",
  },
  ogImageAlt: "Your Self-care Capybara, Cappy. BeCappy, the self-care app with a capybara",
  langSwitchLabel: "Choose a language",

  nav: { home: "BeCappy home", download: "Get the app" },

  hero: {
    eyebrow: "The self-care app with a capybara",
    title: "Your Self-care\nCapybara, Cappy",
    lead: "Manage your routines, talk with Cappy and log how you feel each day.",
    artAlt: "Cappy the capybara from BeCappy",
  },

  features: [
    {
      id: "routine",
      title: "Set daily routines\nand make your day\na little better",
      body: "Turn the things you want to do every day, like waking up early, exercising or reading, into routines. Reminders, streaks and stats help you stay consistent, and you earn hay for every routine you complete.",
      alt: "The BeCappy Routines screen with Meditate, Spanish practice and Gratitude journal, Morning run and Wake up at 7 checked off, and a 16-day streak",
    },
    {
      id: "chat",
      title: "Chat with Cappy\nabout anything,\nin confidence",
      body: "Share good news or worries that are hard to say out loud. Cappy listens all the way through and remembers what you talked about before.",
      alt: "A chat with Cappy. “cappy, i'm kind of wiped out today” gets the reply “sounds like a really busy day. what happened?”",
    },
    {
      id: "journal",
      title: "Discover insights\nthrough\nCappy's Journal",
      body: "The day after you chat, you can read a journal entry Cappy wrote about your day. Looking back from another point of view can help you notice feelings you missed.",
      alt: "A Cappy's Journal entry for Tuesday, August 18",
    },
    {
      id: "mood",
      title: "Track your mood\nand reflect\non your day",
      body: "Pick one of five moods and add a short note. As your entries add up, the calendar shows how your mood changed over the month.",
      alt: "An October mood calendar with a Cappy face for each day's mood",
    },
    {
      id: "shop",
      title: "Dress up Cappy\nwith hay",
      body: "Use the hay you earn from daily check-ins and routines to buy items like hats, glasses and a hanbok. You can also change the theme of Cappy's room.",
      alt: "The shop with Cappy in a gat and hanbok, and hats and glasses to choose from",
    },
  ],

  reviews: {
    title: "What people say\nabout BeCappy",
    source: "App Store reviews",
    ratingLabel: "Rated 5 out of 5",
    items: [
      {
        name: "ハク**",
        text: "Cappy is comforting whenever I'm tired or have some downtime. Earning hay through Routines has also made me more mindful of my daily rhythm.",
      },
      {
        name: "あん**",
        text: "Regular ToDo apps never really worked for me, but here I can simply add the things I want to do each day without the pressure. When I complete them, the hay and little animations feel rewarding, almost like being praised. It's helped me bring a little more structure to my days.",
      },
      {
        name: "かぇ**",
        text: "I love that I can talk things through casually when I don't have anyone to turn to. I also enjoy listening to music and making Cappy look cute!",
      },
    ],
  },

  faq: {
    title: "Frequently asked questions",
    items: [
      {
        q: "What is BeCappy?",
        a: "BeCappy is a self-care app with Cappy the capybara. It has routines, chat with Cappy and a mood log, and the day after you chat you can read the journal entry Cappy wrote.",
      },
      {
        q: "Is BeCappy free?",
        a: "Yes. BeCappy is free to download on the App Store and Google Play. Some extras, like Cappy's Journal, per-routine stats and more conversation, come with a BeCappy Pro subscription.",
      },
      {
        q: "How do I earn hay?",
        a: "Check in daily or complete your routines to earn hay. You can also watch a rewarded ad or buy hay in the shop.",
      },
      {
        q: "Which devices does BeCappy run on?",
        a: "Get BeCappy for iPhone on the App Store, and for Android phones on Google Play.",
      },
    ],
  },

  cta: {
    title: TAGLINE,
    body: "Get started with BeCappy for free.",
  },

  badges: {
    appStoreAlt: "Download on the App Store",
    playAlt: "Get it on Google Play",
  },
  instagram: { label: "Instagram", href: "https://www.instagram.com/becappybara_en" },
  footerLinks: [
    { label: "Contact Us", href: "/support" },
    { label: "Terms", href: "/policy#terms" },
    { label: "Privacy Policy", href: "/policy" },
  ],
  businessInfo: BUSINESS_INFO_EN,
  copyright: COPYRIGHT,
};
