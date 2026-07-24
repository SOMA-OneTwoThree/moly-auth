import { describe, expect, it } from "vitest";
import {
  isValidLanguage,
  isValidNickname,
  isValidPlatform,
  isValidTimezone,
  normalizeLanguage,
} from "../validation";

describe("계정 필드 검증 — moly-backend 스키마와 동일 규칙", () => {
  it("닉네임 1~10자(초과·빈문자열·비문자열 거부)", () => {
    expect(isValidNickname("지우")).toBe(true);
    expect(isValidNickname("열글자닉네임입니다")).toBe(true); // 9자
    expect(isValidNickname("")).toBe(false);
    expect(isValidNickname("열한글자가넘는닉네임임")).toBe(false); // 11자
    expect(isValidNickname(42)).toBe(false);
  });

  it("닉네임 제어·서식 문자 거부(프롬프트 주입 하드닝)", () => {
    expect(isValidNickname("지\n우")).toBe(false); // 개행(제어)
    expect(isValidNickname("지\u0000우")).toBe(false); // NUL(제어)
    expect(isValidNickname("지\u200E우")).toBe(false); // LRM(서식)
    expect(isValidNickname("몰리 친구")).toBe(true); // 일반 공백은 허용
  });

  it("언어 BCP 47 태그 허용 — ko·en-US·zh-Hant-TW·es-419·kok, 주입/문장 차단", () => {
    expect(isValidLanguage("ko")).toBe(true);
    expect(isValidLanguage("en-US")).toBe(true);
    expect(isValidLanguage("zh-Hant-TW")).toBe(true); // 다중 서브태그
    expect(isValidLanguage("es-419")).toBe(true); // 숫자 지역
    expect(isValidLanguage("kok")).toBe(true); // 3자 언어
    expect(isValidLanguage("k")).toBe(false);
    expect(isValidLanguage("ko;drop")).toBe(false);
    expect(isValidLanguage("koreankorean")).toBe(false);
    expect(isValidLanguage("this is en")).toBe(false); // 문장(공백)
    expect(isValidLanguage("ko\n")).toBe(false); // 제어문자
    expect(isValidLanguage("")).toBe(false);
    expect(isValidLanguage(42)).toBe(false);
  });

  it("언어 태그 정규화 — 대소문자 canonical(온보딩·프로필 변경 동일 결과)", () => {
    expect(normalizeLanguage("en-us")).toBe("en-US");
    expect(normalizeLanguage("ZH-HANT-TW")).toBe("zh-Hant-TW");
    expect(normalizeLanguage("ko")).toBe("ko"); // 기존 값 하위호환
    expect(normalizeLanguage("bogus tag")).toBeNull();
  });

  it("푸시 플랫폼 allowlist — ios·android만 허용", () => {
    expect(isValidPlatform("ios")).toBe(true);
    expect(isValidPlatform("android")).toBe(true);
    expect(isValidPlatform("web")).toBe(false);
    expect(isValidPlatform(undefined)).toBe(false);
    expect(isValidPlatform(42)).toBe(false);
  });

  it("IANA 타임존만 허용", () => {
    expect(isValidTimezone("Asia/Seoul")).toBe(true);
    expect(isValidTimezone("UTC")).toBe(true);
    expect(isValidTimezone("Mars/Olympus")).toBe(false);
    expect(isValidTimezone("")).toBe(false);
  });
});
