import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "BeCappy",
  description:
    "카피바라 친구 캐피와 대화하며 고민을 나누고 친해지는 마음 돌봄 앱 BeCappy.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
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
