import { describe, expect, it } from "vitest";
import { activityDateFor } from "../time";

describe("activityDateFor — 앱 기준일(로컬 04:00 경계)", () => {
  it("서울 03:59는 전날로 귀속", () => {
    // 2026-07-09 03:59 KST = 2026-07-08 18:59 UTC
    expect(activityDateFor(new Date("2026-07-08T18:59:00Z"), "Asia/Seoul")).toBe(
      "2026-07-08",
    );
  });

  it("서울 04:00부터 새 날", () => {
    // 2026-07-09 04:00 KST = 2026-07-08 19:00 UTC
    expect(activityDateFor(new Date("2026-07-08T19:00:00Z"), "Asia/Seoul")).toBe(
      "2026-07-09",
    );
  });

  it("타임존이 다르면 같은 순간이라도 기준일이 다르다", () => {
    const t = new Date("2026-07-09T00:30:00Z"); // 서울 09:30(7/9) · 뉴욕 20:30(7/8)
    expect(activityDateFor(t, "Asia/Seoul")).toBe("2026-07-09");
    expect(activityDateFor(t, "America/New_York")).toBe("2026-07-08");
  });
});
