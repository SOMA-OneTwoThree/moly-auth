import { BUSINESS_INFO_EN, COPYRIGHT, TAGLINE } from "./shared";
import type { LandingCopy } from "./types";

/* 用語はアプリ（becappy-mobile lib/l10n/app_ja.arb）に合わせる。 */
export const ja: LandingCopy = {
  langLabel: "日本語",
  htmlLang: "ja",
  ogLocale: "ja_JP",
  searchMeta: {
    title: "BeCappy — カピバラと過ごすセルフケアアプリ",
    description:
      "カピバラのキャピーと過ごすセルフケアアプリ BeCappy。ルーティン管理、AI友だちキャピーとのおしゃべり、気分の記録、キャピーの日記をひとつのアプリで。",
  },
  ogImageAlt: "あなたのセルフケアカピバラ、キャピー。カピバラと過ごすセルフケアアプリ BeCappy",
  langSwitchLabel: "言語を選択",

  nav: { home: "BeCappy ホーム", download: "アプリを入手" },

  hero: {
    eyebrow: "カピバラと過ごすセルフケアアプリ",
    title: "あなたのセルフケア\nカピバラ、キャピー",
    lead: "ルーティンを管理して、キャピーと話して、その日の気分を記録しましょう。",
    artAlt: "BeCappy のカピバラ、キャピー",
  },

  features: [
    {
      id: "routine",
      title: "毎日のルーティンで\n今日をもう少し\n良い一日に",
      body: "早起き、運動、読書など、毎日やりたいことをルーティンに登録しましょう。通知、連続記録、統計で続けやすくなり、ルーティンを完了すると干し草がもらえます。",
      alt: "BeCappy のルーティン画面。瞑想する、英語の勉強、感謝日記を書くと、完了した朝のランニングと7時に起きる、連続16日の記録",
    },
    {
      id: "chat",
      title: "キャピーとなら\nなんでも安心して\n話せる",
      body: "うれしいことも、人に言いにくい悩みも、キャピーに気軽に話してみてください。キャピーは最後まで話を聞いて、前の会話も覚えています。",
      alt: "キャピーとのおしゃべり画面。「キャピー、今日ちょっと疲れちゃった」に、キャピーが「今日はすごく忙しかったんだね。何かあったの？」と返す",
    },
    {
      id: "journal",
      title: "キャピーの日記で\n知らなかった自分に\n出会おう",
      body: "おしゃべりした次の日には、その日の話をもとにキャピーが書いた日記を読めます。別の視点から一日を振り返ると、気づかなかった気持ちが見えてくることもあります。",
      alt: "8月18日（火）にキャピーが書いた日記",
    },
    {
      id: "mood",
      title: "気分を記録して\n毎日を振り返ろう",
      body: "5つの気分から1つを選んで、短いメモを残しましょう。記録がたまると、1か月の気分の変化をカレンダーでひと目で確認できます。",
      alt: "毎日の気分をキャピーの表情で記録した10月のカレンダー",
    },
    {
      id: "shop",
      title: "干し草で\nキャピーをきせかえ",
      body: "出席チェックやルーティンの完了で集めた干し草で、帽子やメガネ、韓服などのアイテムを買えます。キャピーのお部屋のテーマも変えられます。",
      alt: "韓国の伝統衣装を着たキャピーと、帽子やメガネが並ぶショップ画面",
    },
  ],

  reviews: {
    title: "BeCappyと過ごす\nみんなの声",
    source: "App Store のレビュー",
    ratingLabel: "5つ星中5つ星",
    items: [
      {
        name: "ハク**",
        text: "疲れた時や暇な時、キャピーに癒されています。「ルーティン」で干し草を獲得できるので、以前より少しずつ生活リズムを意識できるようになりました！",
      },
      {
        name: "あん**",
        text: "普通のToDoアプリはなかなか続かなかったのですが、ここでは毎日やることを気軽に入れるだけなので使いやすいです。達成できなくても大丈夫で、できた時には干し草や演出があるので、褒めてもらえているような気持ちになります。結果的に、少し計画性のある毎日を過ごせるようになりました。",
      },
      {
        name: "かぇ**",
        text: "誰も頼れる人がいない時でも、気軽に相談に乗ってくれるのがうれしい！音楽を流せるのも、キャピーを可愛くするのも楽しいです。",
      },
    ],
  },

  faq: {
    title: "よくある質問",
    items: [
      {
        q: "BeCappyはどんなアプリですか？",
        a: "カピバラのキャピーと過ごすセルフケアアプリです。ルーティン管理、キャピーとのおしゃべり、気分の記録ができ、おしゃべりした次の日にはキャピーが書いた日記を読めます。",
      },
      {
        q: "無料で使えますか？",
        a: "はい。App Store と Google Play から無料でダウンロードしてお使いいただけます。キャピーの日記、ルーティン別の統計、もっと会話などの一部の特典は BeCappy Pro でご利用いただけます。",
      },
      {
        q: "干し草はどうやって集めますか？",
        a: "毎日の出席チェックやルーティンの完了で干し草がもらえます。リワード広告の視聴やショップでの購入でも手に入ります。",
      },
      {
        q: "どの端末で使えますか？",
        a: "iPhone は App Store から、Android スマートフォンは Google Play から BeCappy をダウンロードできます。",
      },
    ],
  },

  cta: {
    title: TAGLINE,
    body: "BeCappy を無料で始めましょう。",
  },

  badges: {
    appStoreAlt: "App Store でダウンロード",
    playAlt: "Google Play で手に入れよう",
  },
  instagram: { label: "Instagram", href: "https://www.instagram.com/becappybara_jp" },
  footerLinks: [
    { label: "お問い合わせ", href: "/support" },
    { label: "利用規約", href: "/policy#terms" },
    { label: "プライバシーポリシー", href: "/policy" },
  ],
  businessInfo: BUSINESS_INFO_EN,
  copyright: COPYRIGHT,
};
