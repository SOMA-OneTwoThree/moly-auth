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

  // --- 크로스레포 정합(SOMA-348): backend test_time_utils.py와 동일 벡터 ---
  it("뉴욕 DST spring-forward(2026-03-08) 경계", () => {
    // 07:30 UTC = 03:30 EDT → 04:00 미만 → 전날 / 08:30 UTC = 04:30 EDT → 당일
    expect(activityDateFor(new Date("2026-03-08T07:30:00Z"), "America/New_York")).toBe("2026-03-07");
    expect(activityDateFor(new Date("2026-03-08T08:30:00Z"), "America/New_York")).toBe("2026-03-08");
  });

  it("뉴욕 DST fall-back(2026-11-01) 경계", () => {
    // fall-back(06:00 UTC EDT→EST) 이후 EST(UTC-5) 기준.
    // 09:00 UTC = 04:00 EST → 당일(경계 도달) / 08:30 UTC = 03:30 EST → 전날
    expect(activityDateFor(new Date("2026-11-01T09:00:00Z"), "America/New_York")).toBe("2026-11-01");
    expect(activityDateFor(new Date("2026-11-01T08:30:00Z"), "America/New_York")).toBe("2026-10-31");
  });

  it("인도 +5:30 / 네팔 +5:45 오프셋 경계", () => {
    // 인도: 22:00 UTC = 03:30 IST → 전날 / 23:00 UTC = 04:30 IST → 당일
    expect(activityDateFor(new Date("2026-06-30T22:00:00Z"), "Asia/Kolkata")).toBe("2026-06-30");
    expect(activityDateFor(new Date("2026-06-30T23:00:00Z"), "Asia/Kolkata")).toBe("2026-07-01");
    // 네팔: 22:15 UTC = 04:00 NPT → 당일(경계 도달) / 22:14 = 03:59 → 전날
    expect(activityDateFor(new Date("2026-06-30T22:15:00Z"), "Asia/Kathmandu")).toBe("2026-07-01");
    expect(activityDateFor(new Date("2026-06-30T22:14:00Z"), "Asia/Kathmandu")).toBe("2026-06-30");
  });
});
