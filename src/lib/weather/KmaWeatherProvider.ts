/**
 * 기상청(KMA) 날씨 데이터 프로바이더
 * UltraSrtNcst, UltraSrtFcst, VilageFcst API 연동
 */

import type {
  WeatherLocation,
  WeatherNow,
  WeatherHourlyPoint,
  WeatherDailyPoint,
} from "../../domain/types";

// KMA API 응답 타입 정의
interface KmaApiResponse<T> {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      dataType: string;
      items: {
        item: T[];
      };
      pageNo: number;
      numOfRows: number;
      totalCount: number;
    };
  };
}

// 초단기실황 아이템 타입
interface UltraSrtNcstItem {
  baseDate: string;
  baseTime: string;
  category: "T1H" | "REH" | "WSD" | "RN1" | "PTY" | "SKY";
  nx: number;
  ny: number;
  obsrValue: string;
}

// 초단기예보 아이템 타입
interface UltraSrtFcstItem {
  baseDate: string;
  baseTime: string;
  category: "T1H" | "REH" | "WSD" | "RN1" | "PTY" | "SKY" | "LGT" | "VEC";
  fcstDate: string;
  fcstTime: string;
  fcstValue: string;
  nx: number;
  ny: number;
}

// 단기예보 아이템 타입
interface VilageFcstItem {
  baseDate: string;
  baseTime: string;
  category: "POP" | "PTY" | "SKY" | "TMP" | "TMN" | "TMX" | "WSD" | "REH" | "PCP" | "SNO";
  fcstDate: string;
  fcstTime: string;
  fcstValue: string;
  nx: number;
  ny: number;
}

// 그룹화된 데이터 타입 (시간별)
type HourlyGroupedData = Record<string, Partial<Record<UltraSrtFcstItem["category"], string>>>;

// 그룹화된 데이터 타입 (일별)
type DailyGroupedData = Record<string, Partial<Record<VilageFcstItem["category"], string>>>;

export class KmaWeatherProvider {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.baseUrl = "https://apis.data.go.kr/1360000";
    this.apiKey = apiKey;
  }

  /**
   * 현재 날씨 정보 (UltraSrtNcst API)
   */
  async getCurrentWeather(location: WeatherLocation): Promise<WeatherNow> {
    const now = new Date();
    const baseDate = this.formatDate(now);
    const baseTime = this.getBaseTimeForCurrent(now);

    const params = new URLSearchParams({
      serviceKey: this.apiKey,
      pageNo: "1",
      numOfRows: "10",
      dataType: "JSON",
      base_date: baseDate,
      base_time: baseTime,
      nx: location.nx.toString(),
      ny: location.ny.toString(),
    });

    const url = `${this.baseUrl}/VilageFcstInfoService_2.0/getUltraSrtNcst?${params}`;

    const response = await fetch(url);
    const data: KmaApiResponse<UltraSrtNcstItem> = await response.json();

    if (data.response?.header?.resultCode !== "00") {
      throw new Error(`KMA API Error: ${data.response?.header?.resultMsg || "Unknown error"}`);
    }

    const items = data.response?.body?.items?.item;
    if (!items || items.length === 0) {
      throw new Error("No weather data available");
    }

    return this.parseCurrentWeather(items, now.getTime());
  }

  /**
   * 시간별 예보 (UltraSrtFcst + VilageFcst API)
   */
  async getHourlyForecast(location: WeatherLocation): Promise<WeatherHourlyPoint[]> {
    const now = new Date();
    const baseDate = this.formatDate(now);
    const baseTime = this.getBaseTimeForForecast(now);

    // 초단기예보 (0-6시간)
    const ultraParams = new URLSearchParams({
      serviceKey: this.apiKey,
      pageNo: "1",
      numOfRows: "60", // 6시간 * 10개 항목
      dataType: "JSON",
      base_date: baseDate,
      base_time: baseTime,
      nx: location.nx.toString(),
      ny: location.ny.toString(),
    });

    const ultraUrl = `${this.baseUrl}/VilageFcstInfoService_2.0/getUltraSrtFcst?${ultraParams}`;

    const ultraResponse = await fetch(ultraUrl);
    const ultraData: KmaApiResponse<UltraSrtFcstItem> = await ultraResponse.json();

    if (ultraData.response?.header?.resultCode !== "00") {
      throw new Error(`KMA UltraSrtFcst API Error: ${ultraData.response?.header?.resultMsg}`);
    }

    const ultraItems = ultraData.response?.body?.items?.item || [];

    return this.parseHourlyForecast(ultraItems);
  }

  /**
   * 주간 예보 (VilageFcst API)
   */
  async getDailyForecast(location: WeatherLocation): Promise<WeatherDailyPoint[]> {
    const now = new Date();
    const baseDate = this.formatDate(now);
    const baseTime = "0200"; // 단기예보 발표시간

    const params = new URLSearchParams({
      serviceKey: this.apiKey,
      pageNo: "1",
      numOfRows: "200", // 3일 * 8개 항목 * 8개 카테고리 정도
      dataType: "JSON",
      base_date: baseDate,
      base_time: baseTime,
      nx: location.nx.toString(),
      ny: location.ny.toString(),
    });

    const url = `${this.baseUrl}/VilageFcstInfoService_2.0/getVilageFcst?${params}`;

    const response = await fetch(url);
    const data: KmaApiResponse<VilageFcstItem> = await response.json();

    if (data.response?.header?.resultCode !== "00") {
      throw new Error(`KMA VilageFcst API Error: ${data.response?.header?.resultMsg}`);
    }

    const items = data.response?.body?.items?.item || [];

    return this.parseDailyForecast(items);
  }

  // === PRIVATE METHODS ===

  private formatDate(date: Date): string {
    return (
      date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, "0") +
      date.getDate().toString().padStart(2, "0")
    );
  }

  /**
   * 초단기실황 발표시간 결정
   * 매시간 30분에 발표, 현재 시간 기준 가장 최근 발표시간
   */
  private getBaseTimeForCurrent(now: Date): string {
    const hour = now.getHours();
    const minute = now.getMinutes();

    // 현재 시간이 30분 이전이면 이전 시간의 30분 발표
    if (minute < 30) {
      const prevHour = hour === 0 ? 23 : hour - 1;
      return prevHour.toString().padStart(2, "0") + "30";
    } else {
      // 현재 시간이 30분 이후면 현재 시간의 30분 발표
      return hour.toString().padStart(2, "0") + "30";
    }
  }

  /**
   * 예보 발표시간 결정
   * 2, 5, 8, 11, 14, 17, 20, 23시 발표
   */
  private getBaseTimeForForecast(now: Date): string {
    const hour = now.getHours();
    const baseTimes = [2, 5, 8, 11, 14, 17, 20, 23];

    // 현재 시간보다 작거나 같은 가장 최근 발표시간 찾기
    for (let i = baseTimes.length - 1; i >= 0; i--) {
      if (hour >= baseTimes[i]) {
        return baseTimes[i].toString().padStart(2, "0") + "00";
      }
    }

    // 자정을 넘었으면 전날 마지막 발표시간
    return "2300";
  }

  private parseCurrentWeather(items: UltraSrtNcstItem[], timestamp: number): WeatherNow {
    let tempC = 0;
    let humidityPct = 0;
    let windMs = 0;
    let sky: 1 | 3 | 4 = 1;
    let pty: 0 | 1 | 2 | 3 | 5 | 6 | 7 = 0;

    for (const item of items) {
      switch (item.category) {
        case "T1H": // 기온
          tempC = parseFloat(item.obsrValue);
          break;
        case "REH": // 습도
          humidityPct = parseInt(item.obsrValue);
          break;
        case "WSD": // 풍속
          windMs = parseFloat(item.obsrValue);
          break;
        case "SKY": // 하늘상태
          sky = parseInt(item.obsrValue) as 1 | 3 | 4;
          break;
        case "PTY": // 강수형태
          pty = parseInt(item.obsrValue) as 0 | 1 | 2 | 3 | 5 | 6 | 7;
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

  private parseHourlyForecast(items: UltraSrtFcstItem[]): WeatherHourlyPoint[] {
    // 카테고리별로 그룹화
    const groupedByTime: HourlyGroupedData = {};

    for (const item of items) {
      const timeKey = item.fcstTime; // HHMM 형식
      if (!groupedByTime[timeKey]) {
        groupedByTime[timeKey] = {};
      }
      groupedByTime[timeKey][item.category] = item.fcstValue;
    }

    // 시간순으로 정렬하여 변환
    const sortedTimes = Object.keys(groupedByTime).sort();
    const result: WeatherHourlyPoint[] = [];

    for (const timeStr of sortedTimes) {
      const data = groupedByTime[timeStr];
      const hour = parseInt(timeStr.substring(0, 2));
      const minute = parseInt(timeStr.substring(2, 4));

      // 현재 시간 기준 미래 데이터만 포함
      const now = new Date();
      const forecastTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);

      if (forecastTime > now) {
        const point: WeatherHourlyPoint = {
          time: forecastTime.toISOString(),
          tempC: data.T1H ? parseFloat(data.T1H) : 0,
          humidityPct: data.REH ? parseInt(data.REH) : undefined,
          precipProbPct: data.RN1 ? Math.min(parseInt(data.RN1), 100) : undefined,
          sky: data.SKY ? (parseInt(data.SKY) as 1 | 3 | 4) : undefined,
          pty: data.PTY ? (parseInt(data.PTY) as 0 | 1 | 2 | 3 | 5 | 6 | 7) : undefined,
        };

        result.push(point);
      }
    }

    return result.slice(0, 24); // 최대 24시간까지만
  }

  private parseDailyForecast(items: VilageFcstItem[]): WeatherDailyPoint[] {
    // 날짜별로 그룹화
    const groupedByDate: DailyGroupedData = {};

    for (const item of items) {
      const dateKey = item.fcstDate; // YYYYMMDD 형식
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = {};
      }
      groupedByDate[dateKey][item.category] = item.fcstValue;
    }

    // 날짜순으로 정렬하여 변환
    const sortedDates = Object.keys(groupedByDate).sort();
    const result: WeatherDailyPoint[] = [];

    for (const dateStr of sortedDates) {
      const data = groupedByDate[dateStr];

      // 날짜 파싱
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6)) - 1; // JS에서 month는 0-based
      const day = parseInt(dateStr.substring(6, 8));

      const point: WeatherDailyPoint = {
        date: `${year}-${(month + 1).toString().padStart(2, "0")}-${day
          .toString()
          .padStart(2, "0")}`,
        minC: data.TMN ? parseFloat(data.TMN) : 0,
        maxC: data.TMX ? parseFloat(data.TMX) : 0,
        precipProbMaxPct: data.POP ? parseInt(data.POP) : undefined,
        sky: data.SKY ? (parseInt(data.SKY) as 1 | 3 | 4) : undefined,
        pty: data.PTY ? (parseInt(data.PTY) as 0 | 1 | 2 | 3 | 5 | 6 | 7) : undefined,
      };

      result.push(point);
    }

    return result.slice(0, 7); // 최대 7일까지만
  }
}
