import { describe, expect, it } from "vitest";
import { SIGNUP_WINDOW_MS, isNewSignup } from "../signup";

// Supabase가 실제로 내려주는 형태 — 마이크로초 6자리 + +00:00 오프셋.
const CREATED_AT = "2026-07-30T12:00:00.123456+00:00";
const CREATED_MS = Date.parse(CREATED_AT);

describe("isNewSignup — 가입 코호트 기점 판정", () => {
  it("가입 직후 온보딩 미완료면 신규", () => {
    expect(isNewSignup(null, CREATED_AT, new Date(CREATED_MS + 800))).toBe(true);
  });

  it("온보딩을 마쳤으면 가입 직후여도 신규가 아니다", () => {
    expect(isNewSignup("지우", CREATED_AT, new Date(CREATED_MS + 800))).toBe(false);
  });

  it("재설치 후 재로그인한 기존 사용자는 신규가 아니다", () => {
    const later = new Date(CREATED_MS + 90 * 24 * 60 * 60 * 1000);
    expect(isNewSignup("지우", CREATED_AT, later)).toBe(false);
  });

  it("온보딩 미완료라도 창을 벗어나면 신규가 아니다", () => {
    expect(isNewSignup(null, CREATED_AT, new Date(CREATED_MS + SIGNUP_WINDOW_MS))).toBe(true);
    expect(isNewSignup(null, CREATED_AT, new Date(CREATED_MS + SIGNUP_WINDOW_MS + 1))).toBe(false);
  });

  it("서버 시계가 가입 시각보다 살짝 뒤처져도 신규로 본다", () => {
    expect(isNewSignup(null, CREATED_AT, new Date(CREATED_MS - 2000))).toBe(true);
  });

  it("파싱 불가한 created_at은 신규로 보지 않는다", () => {
    expect(isNewSignup(null, "not-a-timestamp", new Date(CREATED_MS))).toBe(false);
  });
});
