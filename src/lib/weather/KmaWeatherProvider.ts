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

// 중기예보 아이템 타입들
interface MidTaItem {
  regId: string; // 지역코드
  taMin3: string; // 3일 후 최저기온
  taMax3: string; // 3일 후 최고기온
  taMin4: string; // 4일 후 최저기온
  taMax4: string; // 4일 후 최고기온
  taMin5: string; // 5일 후 최저기온
  taMax5: string; // 5일 후 최고기온
  taMin6: string; // 6일 후 최저기온
  taMax6: string; // 6일 후 최고기온
  taMin7: string; // 7일 후 최저기온
  taMax7: string; // 7일 후 최고기온
  taMin8: string; // 8일 후 최저기온
  taMax8: string; // 8일 후 최고기온
  taMin9: string; // 9일 후 최저기온
  taMax9: string; // 9일 후 최고기온
  taMin10: string; // 10일 후 최저기온
  taMax10: string; // 10일 후 최고기온
}

interface MidLandFcstItem {
  regId: string; // 지역코드
  wf3Am: string; // 3일 후 오전 날씨
  wf3Pm: string; // 3일 후 오후 날씨
  wf4Am: string; // 4일 후 오전 날씨
  wf4Pm: string; // 4일 후 오후 날씨
  wf5Am: string; // 5일 후 오전 날씨
  wf5Pm: string; // 5일 후 오후 날씨
  wf6Am: string; // 6일 후 오전 날씨
  wf6Pm: string; // 6일 후 오후 날씨
  wf7Am: string; // 7일 후 오전 날씨
  wf7Pm: string; // 7일 후 오후 날씨
  wf8: string; // 8일 후 날씨
  wf9: string; // 9일 후 날씨
  wf10: string; // 10일 후 날씨
  rnSt3Am: string; // 3일 후 오전 강수확률
  rnSt3Pm: string; // 3일 후 오후 강수확률
  rnSt4Am: string; // 4일 후 오전 강수확률
  rnSt4Pm: string; // 4일 후 오후 강수확률
  rnSt5Am: string; // 5일 후 오전 강수확률
  rnSt5Pm: string; // 5일 후 오후 강수확률
  rnSt6Am: string; // 6일 후 오전 강수확률
  rnSt6Pm: string; // 6일 후 오후 강수확률
  rnSt7Am: string; // 7일 후 오전 강수확률
  rnSt7Pm: string; // 7일 후 오후 강수확률
  rnSt8: string; // 8일 후 강수확률
  rnSt9: string; // 9일 후 강수확률
  rnSt10: string; // 10일 후 강수확률
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
    // UltraSrtFcst는 초단기실황 발표시간과 동일하게 매시간 30분에 발표됨
    const baseTime = this.getBaseTimeForCurrent(now);

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
    // debug log removed (too noisy in prod)

    if (ultraData.response?.header?.resultCode !== "00") {
      throw new Error(`KMA UltraSrtFcst API Error: ${ultraData.response?.header?.resultMsg}`);
    }

    const ultraItems = ultraData.response?.body?.items?.item || [];

    return this.parseHourlyForecast(ultraItems);
  }

  /**
   * 24시간 시간별 예보 (단기예보 1시간 데이터 기준)
   *
   * - 2024-11 단기예보 개편 이후, 1일째~4일째까지는 1시간 간격 수치 예보 제공
   * - 이 메서드는 UltraSrtFcst(초단기예보)를 사용하지 않고,
   *   VilageFcst(단기예보)만으로 현재 시각 기준 0~24시간 구간을 구성한다.
   */
  async getHourlyForecast24h(
    location: WeatherLocation,
    date?: string
  ): Promise<WeatherHourlyPoint[]> {
    const targetDate = date ? new Date(date + "T00:00:00+09:00") : new Date();
    // VilageFcst(단기예보)는 고정 발표시각(02, 05, 08, 11, 14, 17, 20, 23시)을 사용해야 함
    const { baseDate: vilageBaseDate, baseTime: vilageBaseTime } =
      this.getBaseTimeForVilageForecast(targetDate);

    // VilageFcst 단기예보 호출 (0~24h 1시간 단위 예보를 단일 소스로 사용)
    const vilageParams = new URLSearchParams({
      serviceKey: this.apiKey,
      pageNo: "1",
      numOfRows: "200",
      dataType: "JSON",
      base_date: vilageBaseDate,
      base_time: vilageBaseTime,
      nx: location.nx.toString(),
      ny: location.ny.toString(),
    });

    const vilageUrl = `${this.baseUrl}/VilageFcstInfoService_2.0/getVilageFcst?${vilageParams}`;
    const vilageResponse = await fetch(vilageUrl);
    const vilageData: KmaApiResponse<VilageFcstItem> = await vilageResponse.json();

    if (vilageData.response?.header?.resultCode !== "00") {
      throw new Error(`KMA VilageFcst API Error: ${vilageData.response?.header?.resultMsg}`);
    }

    const vilageItems = vilageData.response?.body?.items?.item || [];

    // UltraSrtFcst는 사용하지 않고, 단기예보만으로 24시간 구간을 구성
    return this.combineAndInterpolateHourlyData([], vilageItems);
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
      numOfRows: "1000", // 3일 * 8개 항목 * 8개 카테고리 정도
      dataType: "JSON",
      base_date: baseDate,
      base_time: baseTime,
      nx: location.nx.toString(),
      ny: location.ny.toString(),
    });

    const url = `${this.baseUrl}/VilageFcstInfoService_2.0/getVilageFcst?${params}`;

    const response = await fetch(url);
    const data: KmaApiResponse<VilageFcstItem> = await response.json();
    // debug log removed (too noisy in prod)
    if (data.response?.header?.resultCode !== "00") {
      throw new Error(`KMA VilageFcst API Error: ${data.response?.header?.resultMsg}`);
    }

    const items = data.response?.body?.items?.item || [];

    return this.parseDailyForecast(items);
  }

  /**
   * 7일 일별 예보 (단기예보 0~3일 + 중기예보 4~7일)
   *
   * - 0~3일: KMA 단기예보(VilageFcst)의 3시간 간격 TMP를 이용해
   *   오전/오후(하루를 반으로 나눈 시간대)의 평균 기온을 계산하고,
   *   이를 WeatherDailyPoint.minC / maxC 에 각각 매핑한다.
   * - 4~7일: KMA 중기예보(MidTa + MidLandFcst)를 그대로 사용한다.
   * - 추정 데이터(사용자 정의 보정값)는 사용하지 않는다.
   */
  async getDailyForecast7d(location: WeatherLocation): Promise<WeatherDailyPoint[]> {
    const results: WeatherDailyPoint[] = [];

    // 1. 단기예보(0~3일)
    try {
      const shortTerm = await this.getShortTermDaily0to3(location);
      results.push(...shortTerm);
    } catch (error) {
      console.warn("Failed to fetch short-term daily forecast (0-3d):", error);
    }

    // 2. 중기예보(4~7일)
    try {
      const midTerm = await this.getMidTermDaily4to7(location);
      results.push(...midTerm);
    } catch (error) {
      console.warn("Failed to fetch mid-term daily forecast (4-7d):", error);
    }

    // 3. 날짜 기준 중복 제거 + 정렬
    const uniqueResults = results
      .filter((day, index, self) => index === self.findIndex((d) => d.date === day.date))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return uniqueResults.slice(0, 7); // 최대 7일까지만 사용
  }

  /**
   * 중기기온 조회
   */
  private async getMidTemperature(regId: string): Promise<MidTaItem> {
    const now = new Date();
    const baseDate = this.formatDate(now);
    const baseTime = this.getBaseTimeForMidForecast(now);

    const params = new URLSearchParams({
      serviceKey: this.apiKey,
      pageNo: "1",
      numOfRows: "1",
      dataType: "JSON",
      regId: regId,
      tmFc: baseDate + baseTime, // 발표시각
    });

    const url = `${this.baseUrl}/MidFcstInfoService/getMidTa?${params}`;

    const response = await fetch(url);
    const data: KmaApiResponse<MidTaItem> = await response.json();

    if (data.response?.header?.resultCode !== "00") {
      throw new Error(`KMA MidTa API Error: ${data.response?.header?.resultMsg}`);
    }

    const items = data.response?.body?.items?.item;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("KMA MidTa API Error: empty items");
    }

    // 실제 API는 item 배열을 반환하므로 첫 번째 요소만 사용
    return items[0] as unknown as MidTaItem;
  }

  /**
   * 중기육상예보 조회
   */
  private async getMidLandForecast(regId: string): Promise<MidLandFcstItem> {
    const now = new Date();
    const baseDate = this.formatDate(now);
    const baseTime = this.getBaseTimeForMidForecast(now);

    const params = new URLSearchParams({
      serviceKey: this.apiKey,
      pageNo: "1",
      numOfRows: "1",
      dataType: "JSON",
      regId: regId,
      tmFc: baseDate + baseTime, // 발표시각
    });

    const url = `${this.baseUrl}/MidFcstInfoService/getMidLandFcst?${params}`;

    const response = await fetch(url);
    const data: KmaApiResponse<MidLandFcstItem> = await response.json();

    if (data.response?.header?.resultCode !== "00") {
      throw new Error(`KMA MidLandFcst API Error: ${data.response?.header?.resultMsg}`);
    }

    const items = data.response?.body?.items?.item;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("KMA MidLandFcst API Error: empty items");
    }

    // 실제 API는 item 배열을 반환하므로 첫 번째 요소만 사용
    return items[0] as unknown as MidLandFcstItem;
  }

  /**
   * 격자 좌표를 중기예보 지역코드로 변환
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private convertGridToRegId(_nx: number, _ny: number): string {
    // 간단한 매핑 (실제로는 더 정교한 변환 필요)
    // 서울/경기: 11B10101, 11B10102, 11B10103, 11B10104
    // 부산: 11H20101, 11H20102, 11H20103, 11H20104
    // 등등...

    // 임시로 서울 지역으로 매핑
    return "11B10101"; // 서울
  }

  /**
   * 중기예보 발표시간 결정 (6시, 18시 발표)
   */
  private getBaseTimeForMidForecast(now: Date): string {
    const hour = now.getHours();

    // 6시 발표: 06시 ~ 17시 59분
    if (hour >= 6 && hour < 18) {
      return "0600";
    }
    // 18시 발표: 18시 ~ 05시 59분
    else {
      return "1800";
    }
  }

  /**
   * 중기예보 데이터 조합
   */
  private combineMidForecastData(
    tempData: MidTaItem[],
    landData: MidLandFcstItem[]
  ): WeatherDailyPoint[] {
    const result: WeatherDailyPoint[] = [];
    const now = new Date();
    // KST(Asia/Seoul) 기준 오늘 날짜 계산
    const kstOffsetMinutes = 9 * 60 + now.getTimezoneOffset();
    const kstNow = new Date(now.getTime() + kstOffsetMinutes * 60 * 1000);
    const today = new Date(kstNow.getFullYear(), kstNow.getMonth(), kstNow.getDate());

    // API 응답이 배열이므로 첫 번째 요소 사용
    const tempItem = tempData[0];
    const landItem = landData[0];

    if (!tempItem || !landItem) {
      console.warn("No valid mid-term forecast data");
      return result;
    }

    // 중기예보 발표 시간에 따라 시작 날짜 결정
    // 6시 발표: 4일 ~ 10일, 18시 발표: 5일 ~ 10일
    const currentHour = now.getHours();
    const startDay = currentHour >= 6 && currentHour < 18 ? 4 : 5;

    // API에서 제공하는 범위까지만 처리 (최대 10일)
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

      // 강수확률은 오전/오후 중 높은 값 사용
      const precipProbAm = landItem[rnStAmKey] ? parseInt(landItem[rnStAmKey] as string) : 0;
      const precipProbPm = landItem[rnStPmKey] ? parseInt(landItem[rnStPmKey] as string) : 0;
      const maxPrecipProb = Math.max(precipProbAm, precipProbPm);

      // 날씨 상태는 간단히 맑음/흐림/비로 분류
      let sky: 1 | 3 | 4 | undefined;
      let pty: 0 | 1 | 2 | 3 | 5 | 6 | 7 | undefined;

      const weatherDesc = (landItem[wfAmKey] as string) || (landItem[wfPmKey] as string) || "";
      if (weatherDesc.includes("맑음")) {
        sky = 1; // 맑음
        pty = 0; // 없음
      } else if (weatherDesc.includes("구름많음") || weatherDesc.includes("흐림")) {
        sky = 4; // 흐림
        pty = 0; // 없음
      } else if (weatherDesc.includes("비") || weatherDesc.includes("눈")) {
        sky = 4; // 흐림
        pty = weatherDesc.includes("비") ? 1 : 3; // 비 또는 눈
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

  /**
   * VilageFcst(단기예보)에서 7일치 원본 아이템을 조회
   * - getDailyForecast7dFallback 및 getShortTermDaily0to2 에서 재사용
   */
  private async fetchVilageFcstItemsFor7d(location: WeatherLocation): Promise<VilageFcstItem[]> {
    const allItems: VilageFcstItem[] = [];
    const now = new Date();

    // 오늘부터 3일씩 나누어 호출 (VilageFcst는 최대 3일 제공)
    for (let days = 0; days < 7; days += 3) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + days);

      const baseDate = this.formatDate(targetDate);
      const baseTime = "0200"; // 단기예보 발표시간

      const params = new URLSearchParams({
        serviceKey: this.apiKey,
        pageNo: "1",
        numOfRows: "1000",
        dataType: "JSON",
        base_date: baseDate,
        base_time: baseTime,
        nx: location.nx.toString(),
        ny: location.ny.toString(),
      });

      const url = `${this.baseUrl}/VilageFcstInfoService_2.0/getVilageFcst?${params}`;

      try {
        const response = await fetch(url);
        const data: KmaApiResponse<VilageFcstItem> = await response.json();

        if (data.response?.header?.resultCode === "00") {
          const items = data.response?.body?.items?.item || [];
          allItems.push(...items);
        } else {
          console.warn(
            `KMA VilageFcst API Error for ${baseDate}: ${data.response?.header?.resultMsg}`
          );
        }
      } catch (error) {
        console.warn(`Failed to fetch daily forecast for ${baseDate}:`, error);
      }
    }

    return allItems;
  }

  /**
   * 단기예보 기반 0~3일 일별 예보 생성
   *
   * - VilageFcst의 3시간 간격 TMP를 이용해
   *   오전(00~11시) / 오후(12~23시) 평균 기온을 각각 계산한다.
   * - 계산된 오전/오후 평균 기온을 WeatherDailyPoint.minC / maxC 에 매핑한다.
   * - 추정 값(임의 보정값)은 사용하지 않는다.
   */
  private async getShortTermDaily0to3(location: WeatherLocation): Promise<WeatherDailyPoint[]> {
    const allItems = await this.fetchVilageFcstItemsFor7d(location);

    // 날짜별로 아이템 그룹화
    const groupedByDate: Record<string, VilageFcstItem[]> = {};
    for (const item of allItems) {
      const dateKey = item.fcstDate; // YYYYMMDD
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(item);
    }

    const now = new Date();
    // 한국 시간대(KST, Asia/Seoul) 기준 오늘 날짜 계산
    const kstOffsetMinutes = 9 * 60 + now.getTimezoneOffset();
    const kstNow = new Date(now.getTime() + kstOffsetMinutes * 60 * 1000);
    const today = new Date(kstNow.getFullYear(), kstNow.getMonth(), kstNow.getDate());
    today.setHours(0, 0, 0, 0);

    const result: WeatherDailyPoint[] = [];

    for (const dateStr of Object.keys(groupedByDate)) {
      const items = groupedByDate[dateStr];

      // 날짜 파싱
      const year = parseInt(dateStr.substring(0, 4), 10);
      const month = parseInt(dateStr.substring(4, 6), 10) - 1;
      const day = parseInt(dateStr.substring(6, 8), 10);
      const dateObj = new Date(year, month, day);
      dateObj.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((dateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // 0~3일 범위만 사용
      if (diffDays < 0 || diffDays > 3) continue;

      // 오전/오후 TMP 평균 계산
      let morningSum = 0;
      let morningCount = 0;
      let afternoonSum = 0;
      let afternoonCount = 0;

      // 강수확률/하늘/강수형태는 하루 전체 기준 최대/대표값을 사용
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
          if (sky === 1 || sky === 3 || sky === 4) {
            skyCode = sky;
          }
        } else if (item.category === "PTY") {
          const pty = parseInt(item.fcstValue, 10);
          if (
            pty === 0 ||
            pty === 1 ||
            pty === 2 ||
            pty === 3 ||
            pty === 5 ||
            pty === 6 ||
            pty === 7
          ) {
            ptyCode = pty;
          }
        }
      }

      // 오전/오후 데이터가 하나도 없으면 이 날짜는 스킵 (추정 값 사용 금지)
      if (morningCount === 0 || afternoonCount === 0) {
        continue;
      }

      const morningAvg = morningSum / morningCount;
      const afternoonAvg = afternoonSum / afternoonCount;

      const point: WeatherDailyPoint = {
        date: `${year}-${(month + 1).toString().padStart(2, "0")}-${day
          .toString()
          .padStart(2, "0")}`,
        // 오전/오후 평균을 minC / maxC에 매핑
        minC: Math.round(morningAvg),
        maxC: Math.round(afternoonAvg),
        precipProbMaxPct: maxPop,
        sky: skyCode,
        pty: ptyCode,
      };

      result.push(point);
    }

    // 날짜순 정렬 후 반환
    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * 중기예보 기반 4~7일 일별 예보 생성
   */
  private async getMidTermDaily4to7(location: WeatherLocation): Promise<WeatherDailyPoint[]> {
    const regId = this.convertGridToRegId(location.nx, location.ny);
    const [tempData, landData] = await Promise.all([
      this.getMidTemperature(regId),
      this.getMidLandForecast(regId),
    ]);

    const allMid = this.combineMidForecastData([tempData], [landData]);

    const now = new Date();
    // 한국 시간대(KST, Asia/Seoul) 기준 오늘 날짜
    const kstOffsetMinutes = 9 * 60 + now.getTimezoneOffset();
    const kstNow = new Date(now.getTime() + kstOffsetMinutes * 60 * 1000);
    const today = new Date(kstNow.getFullYear(), kstNow.getMonth(), kstNow.getDate());
    today.setHours(0, 0, 0, 0);

    return allMid.filter((point) => {
      const d = new Date(point.date);
      d.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      // 4~7일만 사용 (3일차는 단기예보로 대체)
      return diffDays >= 4 && diffDays <= 7;
    });
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
   * 단기예보(VilageFcst) 발표시간 결정
   *
   * - 공식 문서 기준 base_time 은 02, 05, 08, 11, 14, 17, 20, 23 시 중 하나여야 함
   * - 현재 시간 기준 가장 최근 발표시각을 선택하고,
   *   00~01시는 전날 23시 예보를 사용한다.
   *
   * 이렇게 해야 VilageFcst가 항상 resultCode "00"으로 정상 응답을 반환하고,
   * 단기예보 1시간 데이터를 기반으로 현재 시각 기준 0~24시간 시간별 예보를
   * 안정적으로 구성할 수 있다.
   */
  private getBaseTimeForVilageForecast(now: Date): { baseDate: string; baseTime: string } {
    // KST(Asia/Seoul)를 전제로 하는 단순 로직 (앱 자체가 한국 기준이라 가정)
    const baseDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const hour = now.getHours();

    const candidates = [2, 5, 8, 11, 14, 17, 20, 23];
    let baseHour = candidates[0];
    const dateForBase = new Date(baseDateObj);

    if (hour < candidates[0]) {
      // 새벽 0~1시는 전날 23시 발표분 사용
      dateForBase.setDate(dateForBase.getDate() - 1);
      baseHour = 23;
    } else {
      // 현재 시각보다 작거나 같은 가장 큰 발표시각을 선택
      for (const h of candidates) {
        if (hour >= h) {
          baseHour = h;
        }
      }
    }

    const baseTime = baseHour.toString().padStart(2, "0") + "00";
    const baseDate = this.formatDate(dateForBase);

    return { baseDate, baseTime };
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
    // fcstDate/fcstTime(KST)를 기준으로 그룹화
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
      const ms = this.parseKstForecastMs(grouped.fcstDate, grouped.fcstTime);
      if (!Number.isFinite(ms) || ms <= nowMs) continue;

      const data = grouped.data;
      pointsWithMs.push({
        ms,
        point: {
          time: new Date(ms).toISOString(),
          tempC: data.T1H ? parseFloat(data.T1H) : 0,
          humidityPct: data.REH ? parseInt(data.REH) : undefined,
          precipProbPct: data.RN1 ? Math.min(parseInt(data.RN1), 100) : undefined,
          sky: data.SKY ? (parseInt(data.SKY) as 1 | 3 | 4) : undefined,
          pty: data.PTY ? (parseInt(data.PTY) as 0 | 1 | 2 | 3 | 5 | 6 | 7) : undefined,
        },
      });
    }

    pointsWithMs.sort((a, b) => a.ms - b.ms);
    return pointsWithMs.map((x) => x.point).slice(0, 24);
  }

  private parseKstForecastMs(fcstDate: string, fcstTime: string): number {
    // KMA date/time is in KST(UTC+9): YYYYMMDD + HHMM
    const y = parseInt(fcstDate.slice(0, 4), 10);
    const m = parseInt(fcstDate.slice(4, 6), 10);
    const d = parseInt(fcstDate.slice(6, 8), 10);
    const hh = parseInt(fcstTime.slice(0, 2), 10);
    const mm = parseInt(fcstTime.slice(2, 4), 10);

    if (
      !Number.isFinite(y) ||
      !Number.isFinite(m) ||
      !Number.isFinite(d) ||
      !Number.isFinite(hh) ||
      !Number.isFinite(mm)
    ) {
      return Number.NaN;
    }

    // Convert KST wall-clock -> UTC epoch
    return Date.UTC(y, m - 1, d, hh - 9, mm, 0, 0);
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

  /**
   * UltraSrtFcst + VilageFcst 데이터를 조합하고 1시간 단위로 보간
   */
  private combineAndInterpolateHourlyData(
    ultraItems: UltraSrtFcstItem[],
    vilageItems: VilageFcstItem[]
  ): WeatherHourlyPoint[] {
    const now = new Date();
    const result: WeatherHourlyPoint[] = [];

    // 1. UltraSrtFcst 데이터 파싱 (0-6시간)
    const ultraHourlyData = this.parseHourlyForecast(ultraItems);

    // 2. VilageFcst 데이터를 시간별로 그룹화 (3시간 단위)
    const vilageHourlyMap = new Map<string, Partial<Record<VilageFcstItem["category"], string>>>();

    for (const item of vilageItems) {
      if (
        item.category === "TMP" ||
        item.category === "REH" ||
        item.category === "POP" ||
        item.category === "SKY" ||
        item.category === "PTY"
      ) {
        const timeKey = `${item.fcstDate}${item.fcstTime}`;
        if (!vilageHourlyMap.has(timeKey)) {
          vilageHourlyMap.set(timeKey, {});
        }
        vilageHourlyMap.get(timeKey)![item.category] = item.fcstValue;
      }
    }

    // 3. 24시간 동안 1시간씩 데이터 생성
    for (let hour = 0; hour < 24; hour++) {
      const forecastTime = new Date(now);
      forecastTime.setHours(forecastTime.getHours() + hour);

      if (forecastTime < now) continue; // 과거 데이터 제외

      let tempC: number | undefined;
      let humidityPct: number | undefined;
      let precipProbPct: number | undefined;
      let sky: 1 | 3 | 4 | undefined;
      let pty: 0 | 1 | 2 | 3 | 5 | 6 | 7 | undefined;

      // 0-6시간: UltraSrtFcst 데이터 사용
      if (hour < 6 && ultraHourlyData[hour]) {
        const ultraPoint = ultraHourlyData[hour];
        tempC = ultraPoint.tempC;
        humidityPct = ultraPoint.humidityPct;
        precipProbPct = ultraPoint.precipProbPct;
        sky = ultraPoint.sky;
        pty = ultraPoint.pty;
      }
      // 6-24시간: VilageFcst 데이터 사용 (3시간 단위에서 보간)
      else {
        const vilageData = this.interpolateVilageDataForHour(vilageHourlyMap, forecastTime);
        if (vilageData) {
          tempC = vilageData.tempC;
          humidityPct = vilageData.humidityPct;
          precipProbPct = vilageData.precipProbPct;
          sky = vilageData.sky;
          pty = vilageData.pty;
        }
      }

      // 기본값 설정 (NaN도 체크)
      tempC = tempC != null && !isNaN(tempC) ? tempC : 20;
      humidityPct = humidityPct != null && !isNaN(humidityPct) ? humidityPct : 50;
      precipProbPct = precipProbPct != null && !isNaN(precipProbPct) ? precipProbPct : 0;

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

  /**
   * 특정 시간에 대한 VilageFcst 데이터를 조회/보간
   *
   * 2024-11-28 이후 단기예보가 1시간 간격으로 제공되므로,
   * 우선 "해당 시각의 정시(HH00)" 데이터가 있으면 그대로 사용하고,
   * 없는 경우에만 NaN 방지를 위해 안전하게 기본값(undef)로 처리한다.
   */
  private interpolateVilageDataForHour(
    vilageHourlyMap: Map<string, Partial<Record<VilageFcstItem["category"], string>>>,
    targetTime: Date
  ): {
    tempC?: number;
    humidityPct?: number;
    precipProbPct?: number;
    sky?: 1 | 3 | 4;
    pty?: 0 | 1 | 2 | 3 | 5 | 6 | 7;
  } | null {
    const targetDateStr = this.formatDate(targetTime);
    const hourStr = targetTime.getHours().toString().padStart(2, "0");
    const timeKey = `${targetDateStr}${hourStr}00`;

    const data = vilageHourlyMap.get(timeKey);
    if (!data) return null;

    const tempC = data.TMP ? parseFloat(data.TMP) : undefined;
    const humidityPct = data.REH ? parseInt(data.REH, 10) : undefined;
    const precipProbPct = data.POP ? parseInt(data.POP, 10) : undefined;
    const sky = data.SKY ? (parseInt(data.SKY, 10) as 1 | 3 | 4) : undefined;
    const pty = data.PTY ? (parseInt(data.PTY, 10) as 0 | 1 | 2 | 3 | 5 | 6 | 7) : undefined;

    // NaN 값은 undefined로 처리
    return {
      tempC: tempC != null && !isNaN(tempC) ? tempC : undefined,
      humidityPct: humidityPct != null && !isNaN(humidityPct) ? humidityPct : undefined,
      precipProbPct: precipProbPct != null && !isNaN(precipProbPct) ? precipProbPct : undefined,
      sky: sky != null && !isNaN(sky) ? sky : undefined,
      pty: pty != null && !isNaN(pty) ? pty : undefined,
    };
  }
}
