/**
 * 앱 기준일(activity_date) — ERD §1.2, moly-backend(app/core/time_utils.py)와 동일.
 * = (유저 로컬 현재시각 − 4시간)의 날짜. 하루 경계 = 유저 로컬 오전 04:00.
 */

const DAY_BOUNDARY_HOUR = 4;

/** 주어진 UTC 시각·IANA 타임존의 앱 기준일을 "YYYY-MM-DD"로 반환.
 *
 * backend(app/core/time_utils.py)와 동일 의미: nowUtc를 **먼저 유저 로컬 벽시계로 변환**한 뒤
 * 04:00 경계를 적용한다(로컬시각 < 04:00 → 전날). 오프셋은 nowUtc 기준으로 잡히므로 DST
 * 전환일에도 두 저장소가 같은 활동일을 반환한다(SOMA-348). 이전 구현은 UTC에서 4h를 먼저
 * 빼고 변환해 DST 전환일 로컬 00:00~03:59 구간에서 backend와 하루가 어긋났다.
 */
export function activityDateFor(nowUtc: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(nowUtc);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  let y = Number(get("year"));
  let mo = Number(get("month"));
  let d = Number(get("day"));
  const hour = Number(get("hour")) % 24; // en-CA는 자정을 "24"로 줄 수 있음 → 0으로
  if (hour < DAY_BOUNDARY_HOUR) {
    // 로컬 04:00 이전 = 전날에 귀속. 로컬 달력 날짜에서 하루 뺀다(UTC 산술로 월/연 경계 안전).
    const prev = new Date(Date.UTC(y, mo - 1, d) - 24 * 60 * 60 * 1000);
    y = prev.getUTCFullYear();
    mo = prev.getUTCMonth() + 1;
    d = prev.getUTCDate();
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${y}-${pad(mo)}-${pad(d)}`;
}
