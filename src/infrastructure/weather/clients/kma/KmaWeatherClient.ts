/**
 * 기상청(KMA) 날씨 데이터 프로바이더
 * UltraSrtNcst, UltraSrtFcst, VilageFcst API 연동
 */

import type {
  WeatherDailyPoint,
  WeatherHourlyPoint,
  WeatherLocation,
  WeatherNow,
} from "@/domain/types";
import { formatKmaDate, getBaseTimeForUltraNow, getBaseTimeForVilageForecast } from "./kmaTime";
import { combineAndInterpolateHourlyData, parseCurrentWeather, parseDailyForecast, parseHourlyForecast } from "./kmaParse";
import type { KmaApiClientConfig } from "./kmaApi";
import { fetchUltraSrtFcst, fetchUltraSrtNcst, fetchVilageFcst } from "./kmaApi";
import { getMidTermDaily4to7 } from "./midTermDaily";
import { buildShortTermDaily0to3, fetchVilageFcstItemsFor7d } from "./shortTermDaily";

export class KmaWeatherProvider {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.baseUrl = "https://apis.data.go.kr/1360000";
    this.apiKey = apiKey;
  }

  private get apiConfig(): KmaApiClientConfig {
    return { baseUrl: this.baseUrl, apiKey: this.apiKey };
  }

  async getCurrentWeather(location: WeatherLocation): Promise<WeatherNow> {
    const now = new Date();
    const baseDate = formatKmaDate(now);
    const baseTime = getBaseTimeForUltraNow(now);

    const items = await fetchUltraSrtNcst(this.apiConfig, {
      baseDate,
      baseTime,
      nx: location.nx,
      ny: location.ny,
      numOfRows: 10,
    });

    return parseCurrentWeather(items, now.getTime());
  }

  /**
   * 시간별 예보 (UltraSrtFcst API)
   * - 현재 앱에서는 24시간 예보는 getHourlyForecast24h를 사용
   */
  async getHourlyForecast(location: WeatherLocation): Promise<WeatherHourlyPoint[]> {
    const now = new Date();
    const baseDate = formatKmaDate(now);
    const baseTime = getBaseTimeForUltraNow(now);

    const items = await fetchUltraSrtFcst(this.apiConfig, {
      baseDate,
      baseTime,
      nx: location.nx,
      ny: location.ny,
      numOfRows: 60,
    });

    return parseHourlyForecast(items);
  }

  /**
   * 24시간 시간별 예보 (단기예보 1시간 데이터 기준)
   * - VilageFcst(단기예보)만으로 현재 시각 기준 0~24시간 구간을 구성한다.
   */
  async getHourlyForecast24h(location: WeatherLocation, date?: string): Promise<WeatherHourlyPoint[]> {
    const targetDate = date ? new Date(date + "T00:00:00+09:00") : new Date();
    const { baseDate: vilageBaseDate, baseTime: vilageBaseTime } = getBaseTimeForVilageForecast(targetDate);

    const items = await fetchVilageFcst(this.apiConfig, {
      baseDate: vilageBaseDate,
      baseTime: vilageBaseTime,
      nx: location.nx,
      ny: location.ny,
      numOfRows: 200,
    });

    return combineAndInterpolateHourlyData([], items);
  }

  /**
   * 주간 예보 (VilageFcst API)
   */
  async getDailyForecast(location: WeatherLocation): Promise<WeatherDailyPoint[]> {
    const now = new Date();
    const baseDate = formatKmaDate(now);
    const baseTime = "0200";

    const items = await fetchVilageFcst(this.apiConfig, {
      baseDate,
      baseTime,
      nx: location.nx,
      ny: location.ny,
      numOfRows: 1000,
    });

    return parseDailyForecast(items);
  }

  /**
   * 7일 일별 예보 (단기예보 0~3일 + 중기예보 4~7일)
   */
  async getDailyForecast7d(location: WeatherLocation): Promise<WeatherDailyPoint[]> {
    const now = new Date();
    const results: WeatherDailyPoint[] = [];

    try {
      const items = await fetchVilageFcstItemsFor7d(this.apiConfig, location, now);
      results.push(...buildShortTermDaily0to3(items, now));
    } catch (error) {
      console.warn("Failed to fetch short-term daily forecast (0-3d):", error);
    }

    try {
      const midTerm = await getMidTermDaily4to7(this.apiConfig, location, now);
      results.push(...midTerm);
    } catch (error) {
      console.warn("Failed to fetch mid-term daily forecast (4-7d):", error);
    }

    const uniqueResults = results
      .filter((day, index, self) => index === self.findIndex((d) => d.date === day.date))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return uniqueResults.slice(0, 7);
  }
}
