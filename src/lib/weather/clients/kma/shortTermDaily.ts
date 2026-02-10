import type { WeatherDailyPoint, WeatherLocation } from "@/domain/types";
import type { VilageFcstItem } from "./kmaTypes";
import { formatKmaDate, getKstTodayStart } from "./kmaTime";
import type { KmaApiClientConfig } from "./kmaApi";
import { fetchVilageFcst } from "./kmaApi";

export async function fetchVilageFcstItemsFor7d(
  config: KmaApiClientConfig,
  location: WeatherLocation,
  now: Date = new Date()
): Promise<VilageFcstItem[]> {
  const allItems: VilageFcstItem[] = [];

  for (let days = 0; days < 7; days += 3) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + days);

    const baseDate = formatKmaDate(targetDate);
    const baseTime = "0200";

    try {
      const items = await fetchVilageFcst(config, {
        baseDate,
        baseTime,
        nx: location.nx,
        ny: location.ny,
        numOfRows: 1000,
      });
      allItems.push(...items);
    } catch (error) {
      console.warn(`Failed to fetch daily forecast for ${baseDate}:`, error);
    }
  }

  return allItems;
}

export function buildShortTermDaily0to3(
  allItems: VilageFcstItem[],
  now: Date = new Date()
): WeatherDailyPoint[] {
  const groupedByDate: Record<string, VilageFcstItem[]> = {};
  for (const item of allItems) {
    const dateKey = item.fcstDate;
    if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
    groupedByDate[dateKey].push(item);
  }

  const today = getKstTodayStart(now);
  const result: WeatherDailyPoint[] = [];

  for (const dateStr of Object.keys(groupedByDate)) {
    const items = groupedByDate[dateStr];

    const year = parseInt(dateStr.substring(0, 4), 10);
    const month = parseInt(dateStr.substring(4, 6), 10) - 1;
    const day = parseInt(dateStr.substring(6, 8), 10);
    const dateObj = new Date(year, month, day);
    dateObj.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((dateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0 || diffDays > 3) continue;

    let morningSum = 0;
    let morningCount = 0;
    let afternoonSum = 0;
    let afternoonCount = 0;

    let maxPop: number | undefined;
    let skyCode: 1 | 3 | 4 | undefined;
    let ptyCode: 0 | 1 | 2 | 3 | 5 | 6 | 7 | undefined;

    for (const item of items) {
      const hour = parseInt(item.fcstTime.substring(0, 2), 10);

      if (item.category === "TMP") {
        const temp = parseFloat(item.fcstValue);
        if (!Number.isNaN(temp)) {
          if (hour < 12) {
            morningSum += temp;
            morningCount += 1;
          } else {
            afternoonSum += temp;
            afternoonCount += 1;
          }
        }
      } else if (item.category === "POP") {
        const pop = parseInt(item.fcstValue, 10);
        if (!Number.isNaN(pop)) {
          maxPop = maxPop !== undefined ? Math.max(maxPop, pop) : pop;
        }
      } else if (item.category === "SKY") {
        const sky = parseInt(item.fcstValue, 10);
        if (sky === 1 || sky === 3 || sky === 4) skyCode = sky;
      } else if (item.category === "PTY") {
        const pty = parseInt(item.fcstValue, 10);
        if (pty === 0 || pty === 1 || pty === 2 || pty === 3 || pty === 5 || pty === 6 || pty === 7) {
          ptyCode = pty;
        }
      }
    }

    if (morningCount === 0 || afternoonCount === 0) continue;

    const morningAvg = morningSum / morningCount;
    const afternoonAvg = afternoonSum / afternoonCount;

    result.push({
      date: `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`,
      minC: Math.round(morningAvg),
      maxC: Math.round(afternoonAvg),
      precipProbMaxPct: maxPop,
      sky: skyCode,
      pty: ptyCode,
    });
  }

  return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
