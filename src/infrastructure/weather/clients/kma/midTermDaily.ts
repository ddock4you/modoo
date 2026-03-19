import type { WeatherDailyPoint, WeatherLocation } from "@/domain/types";
import type { MidLandFcstItem, MidTaItem } from "./kmaTypes";
import { formatKmaDate, getBaseTimeForMidForecast, getKstTodayStart } from "./kmaTime";
import type { KmaApiClientConfig } from "./kmaApi";
import { fetchMidLandFcst, fetchMidTa } from "./kmaApi";

function convertGridToRegId(_nx: number, _ny: number): string {
  // TODO: replace with actual mapping table.
  return "11B10101";
}

function combineMidForecastData(
  tempData: MidTaItem[],
  landData: MidLandFcstItem[],
  now: Date = new Date()
): WeatherDailyPoint[] {
  const result: WeatherDailyPoint[] = [];
  const today = getKstTodayStart(now);

  const tempItem = tempData[0];
  const landItem = landData[0];
  if (!tempItem || !landItem) {
    console.warn("No valid mid-term forecast data");
    return result;
  }

  const currentHour = now.getHours();
  const startDay = currentHour >= 6 && currentHour < 18 ? 4 : 5;

  for (let day = startDay; day <= Math.min(7, 10); day++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + day);

    const tempMinKey = `taMin${day}` as keyof MidTaItem;
    const tempMaxKey = `taMax${day}` as keyof MidTaItem;
    const wfAmKey = `wf${day}Am` as keyof MidLandFcstItem;
    const wfPmKey = `wf${day}Pm` as keyof MidLandFcstItem;
    const rnStAmKey = `rnSt${day}Am` as keyof MidLandFcstItem;
    const rnStPmKey = `rnSt${day}Pm` as keyof MidLandFcstItem;

    const rawMinTemp = tempItem[tempMinKey];
    const rawMaxTemp = tempItem[tempMaxKey];
    const minTemp = rawMinTemp ? parseFloat(rawMinTemp as string) : 0;
    const maxTemp = rawMaxTemp ? parseFloat(rawMaxTemp as string) : 0;

    const precipProbAm = landItem[rnStAmKey] ? parseInt(landItem[rnStAmKey] as string, 10) : 0;
    const precipProbPm = landItem[rnStPmKey] ? parseInt(landItem[rnStPmKey] as string, 10) : 0;
    const maxPrecipProb = Math.max(precipProbAm, precipProbPm);

    let sky: 1 | 3 | 4 | undefined;
    let pty: 0 | 1 | 2 | 3 | 5 | 6 | 7 | undefined;

    const weatherDesc = (landItem[wfAmKey] as string) || (landItem[wfPmKey] as string) || "";
    if (weatherDesc.includes("맑음")) {
      sky = 1;
      pty = 0;
    } else if (weatherDesc.includes("구름많음") || weatherDesc.includes("흐림")) {
      sky = 4;
      pty = 0;
    } else if (weatherDesc.includes("비") || weatherDesc.includes("눈")) {
      sky = 4;
      pty = weatherDesc.includes("비") ? 1 : 3;
    }

    result.push({
      date: targetDate.toISOString().split("T")[0],
      minC: minTemp,
      maxC: maxTemp,
      precipProbMaxPct: maxPrecipProb > 0 ? maxPrecipProb : undefined,
      sky,
      pty,
    });
  }

  return result;
}

export async function getMidTermDaily4to7(
  config: KmaApiClientConfig,
  location: WeatherLocation,
  now: Date = new Date()
): Promise<WeatherDailyPoint[]> {
  const regId = convertGridToRegId(location.nx, location.ny);
  const baseDate = formatKmaDate(now);
  const baseTime = getBaseTimeForMidForecast(now);
  const tmFc = baseDate + baseTime;

  const [tempItems, landItems] = await Promise.all([
    fetchMidTa(config, { regId, tmFc }),
    fetchMidLandFcst(config, { regId, tmFc }),
  ]);

  const allMid = combineMidForecastData(tempItems, landItems, now);
  const today = getKstTodayStart(now);

  return allMid.filter((point) => {
    const d = new Date(point.date);
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 4 && diffDays <= 7;
  });
}
