// Date utilities for KST(Asia/Seoul)

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function getKstYmdParts(date: Date): { year: number; month: number; day: number } {
  // Shift timestamp by +9h, then read via UTC getters to avoid local timezone influence.
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  return {
    year: kst.getUTCFullYear(),
    month: kst.getUTCMonth() + 1,
    day: kst.getUTCDate(),
  };
}

/**
 * 날짜를 KST 기준 정오(12:00)로 변환하여 epoch ms 반환
 */
export function toKstNoon(date: Date): number {
  const { year, month, day } = getKstYmdParts(date);
  // KST 12:00 == UTC 03:00 on the same KST calendar date
  return Date.UTC(year, month - 1, day, 12, 0, 0, 0) - KST_OFFSET_MS;
}

/**
 * 날짜를 KST 기준 자정(00:00)으로 변환하여 epoch ms 반환
 */
export function toKstMidnight(date: Date): number {
  const { year, month, day } = getKstYmdParts(date);
  // KST 00:00 == UTC 15:00 on the previous UTC day
  return Date.UTC(year, month - 1, day, 0, 0, 0, 0) - KST_OFFSET_MS;
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷팅
 */
export function formatYmd(date: Date): string {
  const { year, month, day } = getKstYmdParts(date);
  const mm = `${month}`.padStart(2, "0");
  const dd = `${day}`.padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export function getKstTodayYmd(nowMs: number = Date.now()): string {
  return formatYmd(new Date(nowMs));
}

export function parseYmdToPickerDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map((x) => Number(x));
  // Use local noon to avoid accidental date shifting in the calendar UI.
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}
