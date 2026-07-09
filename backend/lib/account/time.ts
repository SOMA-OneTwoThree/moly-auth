/**
 * 앱 기준일(activity_date) — ERD §1.2, moly-backend(app/core/time_utils.py)와 동일.
 * = (유저 로컬 현재시각 − 4시간)의 날짜. 하루 경계 = 유저 로컬 오전 04:00.
 */

const DAY_BOUNDARY_HOURS_MS = 4 * 60 * 60 * 1000;

/** 주어진 UTC 시각·IANA 타임존의 앱 기준일을 "YYYY-MM-DD"로 반환. */
export function activityDateFor(nowUtc: Date, timeZone: string): string {
  const shifted = new Date(nowUtc.getTime() - DAY_BOUNDARY_HOURS_MS);
  // en-CA 로케일 = YYYY-MM-DD 형식
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(shifted);
}
