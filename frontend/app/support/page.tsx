import type { Metadata } from "next";
import styles from "./support.module.css";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "고객 지원 | BeCappy",
  description: "BeCappy 서비스 이용 문의 및 자주 묻는 질문 안내 페이지입니다.",
};

const SUPPORT_EMAIL = "nonoeul123@gmail.com";

const FAQ: { q: string; a: string }[] = [
  {
    q: "구독은 어떻게 해지하나요?",
    a: "구독은 Apple App Store를 통해 관리됩니다. iPhone의 설정 > [내 이름] > 구독에서 언제든지 해지할 수 있으며, 해지 후에도 남은 구독 기간 동안 혜택은 유지됩니다.",
  },
  {
    q: "결제 환불은 어떻게 하나요?",
    a: "인앱 결제(구독·건초)의 환불은 Apple의 환불 정책에 따라 처리됩니다. reportaproblem.apple.com에서 신청하실 수 있습니다.",
  },
  {
    q: "회원 탈퇴는 어떻게 하나요?",
    a: "앱 내 설정 > 회원 탈퇴에서 진행하실 수 있습니다. 탈퇴 시 대화·일기 등 모든 데이터가 삭제되며 복구할 수 없습니다. 다만 구독은 자동으로 해지되지 않으므로 App Store에서 별도로 해지해 주세요.",
  },
  {
    q: "하루에 나눌 수 있는 대화에 제한이 있나요?",
    a: "이용 등급에 따라 하루 대화 한도가 있으며, 매일 오전 4시에 초기화됩니다. 한도에 도달하면 다음 날 다시 대화할 수 있어요.",
  },
  {
    q: "캐피의 일기는 언제 발행되나요?",
    a: "전날 나눈 대화를 바탕으로 매일 아침 9시에 발행됩니다. 일기 열람은 누구나 무료예요.",
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
          아래 이메일로 연락 주시면 신속하게 답변 드리겠습니다.
        </p>
      </header>

      <section className={styles.card} aria-label="문의 연락처">
        <div className={styles.row}>
          <span className={styles.label}>이메일</span>
          <a className={styles.email} href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
        </div>
        <div className={styles.divider} />
        <div className={styles.row}>
          <span className={styles.label}>응답 시간</span>
          <span className={styles.value}>영업일 기준 1~3일 이내</span>
        </div>
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
