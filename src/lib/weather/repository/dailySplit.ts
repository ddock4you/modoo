import type { WeatherDailyPoint } from "@/domain/types";
import { getKstYmd, kstYmdToMidnightBaseTime } from "@/lib/weather/utils/baseTime";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function combineDaily(shortData?: WeatherDailyPoint[], midData?: WeatherDailyPoint[]): WeatherDailyPoint[] | null {
  const combined = [...(shortData ?? []), ...(midData ?? [])];
  if (combined.length === 0) return null;

  // YYYY-MM-DD lexicographic order matches chronological order.
  return combined
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export function splitDailyForCache(
  daily: WeatherDailyPoint[],
  nowMs: number
): { shortTerm: WeatherDailyPoint[]; midTerm: WeatherDailyPoint[] } {
  const kstYmdToday = getKstYmd(new Date(nowMs + KST_OFFSET_MS));
  const todayBase = kstYmdToMidnightBaseTime(kstYmdToday);

  const shortTerm: WeatherDailyPoint[] = [];
  const midTerm: WeatherDailyPoint[] = [];

  for (const day of daily) {
    // WeatherDailyPoint.date is YYYY-MM-DD (KST day semantics).
    const dayBase = kstYmdToMidnightBaseTime(day.date);
    const daysDiff = Math.floor((dayBase - todayBase) / MS_PER_DAY);

    if (daysDiff >= 0 && daysDiff <= 3) shortTerm.push(day);
    else if (daysDiff >= 4 && daysDiff <= 10) midTerm.push(day);
  }

  return { shortTerm, midTerm };
}
