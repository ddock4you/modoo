export function formatKmaDate(date: Date): string {
  return (
    date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, "0") +
    date.getDate().toString().padStart(2, "0")
  );
}

/**
 * UltraSrtNcst/UltraSrtFcst 발표시각: 매시 30분.
 * - 현재 시간이 30분 이전이면 이전 시간의 30분 발표를 사용
 */
export function getBaseTimeForUltraNow(now: Date): string {
  const hour = now.getHours();
  const minute = now.getMinutes();

  if (minute < 30) {
    const prevHour = hour === 0 ? 23 : hour - 1;
    return prevHour.toString().padStart(2, "0") + "30";
  }

  return hour.toString().padStart(2, "0") + "30";
}

/**
 * VilageFcst(단기예보) 발표시각: 02, 05, 08, 11, 14, 17, 20, 23시.
 * - 00~01시는 전날 23시 발표분 사용
 */
export function getBaseTimeForVilageForecast(now: Date): { baseDate: string; baseTime: string } {
  const baseDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const hour = now.getHours();

  const candidates = [2, 5, 8, 11, 14, 17, 20, 23];
  let baseHour = candidates[0];
  const dateForBase = new Date(baseDateObj);

  if (hour < candidates[0]) {
    dateForBase.setDate(dateForBase.getDate() - 1);
    baseHour = 23;
  } else {
    for (const h of candidates) {
      if (hour >= h) baseHour = h;
    }
  }

  const baseTime = baseHour.toString().padStart(2, "0") + "00";
  const baseDate = formatKmaDate(dateForBase);
  return { baseDate, baseTime };
}

/**
 * 중기예보 발표시간: 06시, 18시.
 */
export function getBaseTimeForMidForecast(now: Date): string {
  const hour = now.getHours();
  return hour >= 6 && hour < 18 ? "0600" : "1800";
}

/**
 * KMA date/time is in KST(UTC+9): YYYYMMDD + HHMM
 * Convert KST wall-clock -> UTC epoch.
 */
export function parseKstForecastMs(fcstDate: string, fcstTime: string): number {
  const y = parseInt(fcstDate.slice(0, 4), 10);
  const m = parseInt(fcstDate.slice(4, 6), 10);
  const d = parseInt(fcstDate.slice(6, 8), 10);
  const hh = parseInt(fcstTime.slice(0, 2), 10);
  const mm = parseInt(fcstTime.slice(2, 4), 10);

  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d) || !Number.isFinite(hh) || !Number.isFinite(mm)) {
    return Number.NaN;
  }

  return Date.UTC(y, m - 1, d, hh - 9, mm, 0, 0);
}

export function getKstTodayStart(now: Date = new Date()): Date {
  const kstOffsetMinutes = 9 * 60 + now.getTimezoneOffset();
  const kstNow = new Date(now.getTime() + kstOffsetMinutes * 60 * 1000);
  const today = new Date(kstNow.getFullYear(), kstNow.getMonth(), kstNow.getDate());
  today.setHours(0, 0, 0, 0);
  return today;
}
