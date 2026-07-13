import type { Metadata } from "next";
import Image from "next/image";
import styles from "./support.module.css";
import kakaoIcon from "@/images/kakaotalk.png";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "고객 지원 | BeCappy",
  description: "BeCappy 서비스 이용 문의 및 자주 묻는 질문 안내 페이지입니다.",
};

const SUPPORT_EMAIL = "nonoeul123@gmail.com";
const KAKAO_CHANNEL_URL = "https://pf.kakao.com/_TshfX";

const FAQ: { q: string; a: string }[] = [
  {
    q: "결제 환불은 어떻게 하나요?",
    a: "인앱 결제(건초)의 환불은 Apple의 환불 정책에 따라 처리됩니다. reportaproblem.apple.com에서 신청하실 수 있습니다.",
  },
  {
    q: "회원 탈퇴는 어떻게 하나요?",
    a: "앱 내 설정 > 회원 탈퇴에서 진행하실 수 있습니다. 탈퇴 시 대화·일기 등 모든 데이터가 삭제되며 복구할 수 없습니다.",
  },
  {
    q: "하루에 나눌 수 있는 대화에 제한이 있나요?",
    a: "하루 대화 한도가 있으며, 매일 오전 4시에 초기화됩니다. 한도에 도달하면 다음 날 다시 대화할 수 있어요.",
  },
  {
    q: "캐피의 일기는 언제 발행되나요?",
    a: "전날 나눈 대화를 바탕으로 매일 아침 9시에 발행됩니다.",
  },
  {
    q: "건초는 어떻게 모을 수 있나요?",
    a: "매일 출석 체크, 리워드 광고 시청, 루틴 완료 보상으로 모을 수 있고, 상점에서 구매할 수도 있습니다.",
  },
];

export default function SupportPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>BeCappy 고객 지원</h1>
        <p className={styles.lead}>
          서비스 이용 중 문의사항이나 불편한 점이 있으시면
          <br />
          아래 채널로 편하게 연락 주세요.
        </p>
      </header>

      <section className={styles.channels} aria-label="문의 채널">
        <a
          className={`${styles.channelCard} ${styles.kakaoCard}`}
          href={KAKAO_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            src={kakaoIcon}
            alt=""
            width={44}
            height={44}
            className={styles.channelIcon}
          />
          <span className={styles.channelBody}>
            <span className={styles.channelName}>카카오톡 채널 문의</span>
            <span className={styles.channelDesc}>
              1:1 채팅으로 가장 빠르게 답변받을 수 있어요
            </span>
          </span>
          <span className={styles.channelArrow} aria-hidden>
            ›
          </span>
        </a>

        <a className={styles.channelCard} href={`mailto:${SUPPORT_EMAIL}`}>
          <span className={styles.emailIcon} aria-hidden>
            ✉️
          </span>
          <span className={styles.channelBody}>
            <span className={styles.channelName}>이메일 문의</span>
            <span className={styles.channelDesc}>
              {SUPPORT_EMAIL} · 영업일 기준 1~3일 이내 답변
            </span>
          </span>
          <span className={styles.channelArrow} aria-hidden>
            ›
          </span>
        </a>
      </section>

      <section aria-label="자주 묻는 질문">
        <h2 className={styles.faqTitle}>자주 묻는 질문</h2>
        <ul className={styles.faqList}>
          {FAQ.map((item) => (
            <li key={item.q} className={styles.faqItem}>
              <p className={styles.faqQ}>Q. {item.q}</p>
              <p className={styles.faqA}>{item.a}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
