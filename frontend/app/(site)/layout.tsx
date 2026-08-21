import type { ReactNode } from "react";
import "../globals.css";

export const metadata = {
  title: "BeCappy",
  description:
    "카피바라 친구 캐피와 대화하며 고민을 나누고 친해지는 마음 돌봄 앱 BeCappy.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  /*
   * 이 그룹(policy/support/account-deletion)은 언어 정책상 **영문 전용**이다
   * (ARCHITECTURE §1). 랜딩은 `(landing)` 그룹이 자체 <html>을 낸다.
   */
  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          margin: 0,
          background: "var(--bg)",
          color: "var(--text)",
        }}
      >
        {children}
      </body>
    </html>
  );
}
