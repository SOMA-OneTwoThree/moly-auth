import { describe, expect, it } from "vitest";
import {
  isValidLanguage,
  isValidNickname,
  isValidTimezone,
} from "../validation";

describe("계정 필드 검증 — moly-backend 스키마와 동일 규칙", () => {
  it("닉네임 1~10자(초과·빈문자열·비문자열 거부)", () => {
    expect(isValidNickname("지우")).toBe(true);
    expect(isValidNickname("열글자닉네임입니다")).toBe(true); // 9자
    expect(isValidNickname("")).toBe(false);
    expect(isValidNickname("열한글자가넘는닉네임임")).toBe(false); // 11자
    expect(isValidNickname(42)).toBe(false);
  });

  it("언어 ISO 639-1(+선택 지역) — 주입 문자 차단", () => {
    expect(isValidLanguage("ko")).toBe(true);
    expect(isValidLanguage("en-US")).toBe(true);
    expect(isValidLanguage("k")).toBe(false);
    expect(isValidLanguage("ko;drop")).toBe(false);
    expect(isValidLanguage("koreankorean")).toBe(false);
  });

  it("IANA 타임존만 허용", () => {
    expect(isValidTimezone("Asia/Seoul")).toBe(true);
    expect(isValidTimezone("UTC")).toBe(true);
    expect(isValidTimezone("Mars/Olympus")).toBe(false);
    expect(isValidTimezone("")).toBe(false);
  });
});
