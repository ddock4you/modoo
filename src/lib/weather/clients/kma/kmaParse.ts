import type { WeatherDailyPoint, WeatherHourlyPoint, WeatherNow } from "@/domain/types";
import type { DailyGroupedData, UltraSrtFcstItem, UltraSrtNcstItem, VilageFcstItem } from "./kmaTypes";
import { formatKmaDate, parseKstForecastMs } from "./kmaTime";

export function parseCurrentWeather(items: UltraSrtNcstItem[], timestamp: number): WeatherNow {
  let tempC = 0;
  let humidityPct = 0;
  let windMs = 0;
  let sky: 1 | 3 | 4 = 1;
  let pty: 0 | 1 | 2 | 3 | 5 | 6 | 7 = 0;

  for (const item of items) {
    switch (item.category) {
      case "T1H":
        tempC = parseFloat(item.obsrValue);
        break;
      case "REH":
        humidityPct = parseInt(item.obsrValue, 10);
        break;
      case "WSD":
        windMs = parseFloat(item.obsrValue);
        break;
      case "SKY":
        sky = parseInt(item.obsrValue, 10) as 1 | 3 | 4;
        break;
      case "PTY":
        pty = parseInt(item.obsrValue, 10) as 0 | 1 | 2 | 3 | 5 | 6 | 7;
        break;
    }
  }

  return {
    tempC,
    humidityPct,
    windMs,
    weatherCode: { sky, pty },
    updatedAt: timestamp,
  };
}

export function parseHourlyForecast(items: UltraSrtFcstItem[]): WeatherHourlyPoint[] {
  const groupedByDateTime: Record<
    string,
    { fcstDate: string; fcstTime: string; data: Partial<Record<UltraSrtFcstItem["category"], string>> }
  > = {};

  for (const item of items) {
    const key = `${item.fcstDate}${item.fcstTime}`;
    if (!groupedByDateTime[key]) {
      groupedByDateTime[key] = { fcstDate: item.fcstDate, fcstTime: item.fcstTime, data: {} };
    }
    groupedByDateTime[key].data[item.category] = item.fcstValue;
  }

  const nowMs = Date.now();
  const pointsWithMs: Array<{ ms: number; point: WeatherHourlyPoint }> = [];

  for (const grouped of Object.values(groupedByDateTime)) {
    const ms = parseKstForecastMs(grouped.fcstDate, grouped.fcstTime);
    if (!Number.isFinite(ms) || ms <= nowMs) continue;

    const data = grouped.data;
    pointsWithMs.push({
      ms,
      point: {
        time: new Date(ms).toISOString(),
        tempC: data.T1H ? parseFloat(data.T1H) : 0,
        humidityPct: data.REH ? parseInt(data.REH, 10) : undefined,
        precipProbPct: data.RN1 ? Math.min(parseInt(data.RN1, 10), 100) : undefined,
        sky: data.SKY ? (parseInt(data.SKY, 10) as 1 | 3 | 4) : undefined,
        pty: data.PTY ? (parseInt(data.PTY, 10) as 0 | 1 | 2 | 3 | 5 | 6 | 7) : undefined,
      },
    });
  }

  pointsWithMs.sort((a, b) => a.ms - b.ms);
  return pointsWithMs.map((x) => x.point).slice(0, 24);
}

export function parseDailyForecast(items: VilageFcstItem[]): WeatherDailyPoint[] {
  const groupedByDate: DailyGroupedData = {};

  for (const item of items) {
    const dateKey = item.fcstDate;
    if (!groupedByDate[dateKey]) groupedByDate[dateKey] = {};
    groupedByDate[dateKey][item.category] = item.fcstValue;
  }

  const sortedDates = Object.keys(groupedByDate).sort();
  const result: WeatherDailyPoint[] = [];

  for (const dateStr of sortedDates) {
    const data = groupedByDate[dateStr];

    const year = parseInt(dateStr.substring(0, 4), 10);
    const month = parseInt(dateStr.substring(4, 6), 10) - 1;
    const day = parseInt(dateStr.substring(6, 8), 10);

    result.push({
      date: `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`,
      minC: data.TMN ? parseFloat(data.TMN) : 0,
      maxC: data.TMX ? parseFloat(data.TMX) : 0,
      precipProbMaxPct: data.POP ? parseInt(data.POP, 10) : undefined,
      sky: data.SKY ? (parseInt(data.SKY, 10) as 1 | 3 | 4) : undefined,
      pty: data.PTY ? (parseInt(data.PTY, 10) as 0 | 1 | 2 | 3 | 5 | 6 | 7) : undefined,
    });
  }

  return result.slice(0, 7);
}

export function combineAndInterpolateHourlyData(
  ultraItems: UltraSrtFcstItem[],
  vilageItems: VilageFcstItem[],
  now: Date = new Date()
): WeatherHourlyPoint[] {
  const result: WeatherHourlyPoint[] = [];

  const ultraHourlyData = parseHourlyForecast(ultraItems);

  const vilageHourlyMap = new Map<string, Partial<Record<VilageFcstItem["category"], string>>>();
  for (const item of vilageItems) {
    if (item.category === "TMP" || item.category === "REH" || item.category === "POP" || item.category === "SKY" || item.category === "PTY") {
      const timeKey = `${item.fcstDate}${item.fcstTime}`;
      if (!vilageHourlyMap.has(timeKey)) vilageHourlyMap.set(timeKey, {});
      vilageHourlyMap.get(timeKey)![item.category] = item.fcstValue;
    }
  }

  for (let hour = 0; hour < 24; hour++) {
    const forecastTime = new Date(now);
    forecastTime.setHours(forecastTime.getHours() + hour);
    if (forecastTime < now) continue;

    let tempC: number | undefined;
    let humidityPct: number | undefined;
    let precipProbPct: number | undefined;
    let sky: 1 | 3 | 4 | undefined;
    let pty: 0 | 1 | 2 | 3 | 5 | 6 | 7 | undefined;

    if (hour < 6 && ultraHourlyData[hour]) {
      const ultraPoint = ultraHourlyData[hour];
      tempC = ultraPoint.tempC;
      humidityPct = ultraPoint.humidityPct;
      precipProbPct = ultraPoint.precipProbPct;
      sky = ultraPoint.sky;
      pty = ultraPoint.pty;
    } else {
      const vilageData = interpolateVilageDataForHour(vilageHourlyMap, forecastTime);
      if (vilageData) {
        tempC = vilageData.tempC;
        humidityPct = vilageData.humidityPct;
        precipProbPct = vilageData.precipProbPct;
        sky = vilageData.sky;
        pty = vilageData.pty;
      }
    }

    tempC = tempC != null && !Number.isNaN(tempC) ? tempC : 20;
    humidityPct = humidityPct != null && !Number.isNaN(humidityPct) ? humidityPct : 50;
    precipProbPct = precipProbPct != null && !Number.isNaN(precipProbPct) ? precipProbPct : 0;

    result.push({
      time: forecastTime.toISOString(),
      tempC,
      humidityPct,
      precipProbPct,
      sky,
      pty,
    });
  }

  return result;
}

export function interpolateVilageDataForHour(
  vilageHourlyMap: Map<string, Partial<Record<VilageFcstItem["category"], string>>>,
  targetTime: Date
): {
  tempC?: number;
  humidityPct?: number;
  precipProbPct?: number;
  sky?: 1 | 3 | 4;
  pty?: 0 | 1 | 2 | 3 | 5 | 6 | 7;
} | null {
  const targetDateStr = formatKmaDate(targetTime);
  const hourStr = targetTime.getHours().toString().padStart(2, "0");
  const timeKey = `${targetDateStr}${hourStr}00`;

  const data = vilageHourlyMap.get(timeKey);
  if (!data) return null;

  const tempC = data.TMP ? parseFloat(data.TMP) : undefined;
  const humidityPct = data.REH ? parseInt(data.REH, 10) : undefined;
  const precipProbPct = data.POP ? parseInt(data.POP, 10) : undefined;
  const sky = data.SKY ? (parseInt(data.SKY, 10) as 1 | 3 | 4) : undefined;
  const pty = data.PTY ? (parseInt(data.PTY, 10) as 0 | 1 | 2 | 3 | 5 | 6 | 7) : undefined;

  return {
    tempC: tempC != null && !Number.isNaN(tempC) ? tempC : undefined,
    humidityPct: humidityPct != null && !Number.isNaN(humidityPct) ? humidityPct : undefined,
    precipProbPct: precipProbPct != null && !Number.isNaN(precipProbPct) ? precipProbPct : undefined,
    sky: sky != null && !Number.isNaN(sky) ? sky : undefined,
    pty: pty != null && !Number.isNaN(pty) ? pty : undefined,
  };
}
