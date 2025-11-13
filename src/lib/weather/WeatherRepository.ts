/**
 * Weather Repository 인터페이스
 * IndexedDB 캐시와 외부 API 프로바이더들을 통합 관리
 */

import type {
  WeatherLocation,
  WeatherNow,
  WeatherHourlyPoint,
  WeatherDailyPoint,
  AirQuality,
} from "../../domain/types";
import { weatherCache } from "./IndexedDbWeatherCache";
import { KmaWeatherProvider } from "./KmaWeatherProvider";
import { AirKoreaProvider } from "./AirKoreaProvider";
import { VWorldGeocodingProvider } from "./VWorldGeocodingProvider";
import { latLonToGrid } from "./kmaGrid";
import { latLonToTM } from "./coord";

export interface WeatherData {
  now?: WeatherNow;
  hourly?: WeatherHourlyPoint[];
  daily?: WeatherDailyPoint[];
  airQuality?: AirQuality;
  location?: WeatherLocation;
  isOffline?: boolean;
  lastUpdated?: number;
}

export interface WeatherRepositoryConfig {
  kmaApiKey: string;
  airKoreaApiKey: string;
  vworldApiKey: string;
}

/**
 * 날씨 데이터 저장소 인터페이스
 */
export interface IWeatherRepository {
  init(): Promise<void>;
  /**
   * 현재 날씨 데이터 조회 (캐시 우선, 없으면 API 호출)
   */
  getNow(locationId: string): Promise<WeatherNow | null>;

  /**
   * 시간별 날씨 데이터 조회 (캐시 우선, 없으면 API 호출)
   */
  getHourly(locationId: string): Promise<WeatherHourlyPoint[] | null>;

  /**
   * 일별 날씨 데이터 조회 (캐시 우선, 없으면 API 호출)
   */
  getDaily(locationId: string): Promise<WeatherDailyPoint[] | null>;

  /**
   * 대기질 데이터 조회 (캐시 우선, 없으면 API 호출)
   */
  getAirQuality(locationId: string): Promise<AirQuality | null>;

  /**
   * 위치 정보 조회 또는 생성 (역지오코딩 포함)
   */
  getOrCreateLocation(lat: number, lon: number): Promise<WeatherLocation>;

  /**
   * 캐시된 데이터가 있는지 확인
   */
  hasCachedData(locationId: string): Promise<boolean>;

  /**
   * 캐시 정리
   */
  cleanup(): Promise<void>;
}

/**
 * Weather Repository 구현체
 * IndexedDB 캐시 + 외부 API 프로바이더 통합
 */
export class WeatherRepository implements IWeatherRepository {
  private kmaProvider: KmaWeatherProvider;
  private airKoreaProvider: AirKoreaProvider;
  private vworldProvider: VWorldGeocodingProvider;
  private initialized = false;

  constructor(config: WeatherRepositoryConfig) {
    this.kmaProvider = new KmaWeatherProvider(config.kmaApiKey);
    this.airKoreaProvider = new AirKoreaProvider(config.airKoreaApiKey);
    this.vworldProvider = new VWorldGeocodingProvider(config.vworldApiKey);
  }

  /**
   * 초기화 (캐시 초기화)
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    await weatherCache.init();
    this.initialized = true;
  }

  /**
   * locationId를 KMA 격자 기반으로 생성
   */
  private generateLocationId(lat: number, lon: number): string {
    const { nx, ny } = latLonToGrid(lat, lon);
    return `grid_${nx}_${ny}`;
  }

  /**
   * baseTime을 타입별로 정규화
   */
  private normalizeBaseTime(
    baseTime: number,
    type: "now" | "hourly" | "daily" | "airQuality"
  ): number {
    const date = new Date(baseTime);

    switch (type) {
      case "now": {
        // 10분 단위로 정규화 (00, 10, 20, 30, 40, 50분)
        const minutes = Math.floor(date.getMinutes() / 10) * 10;
        return new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          date.getHours(),
          minutes
        ).getTime();
      }

      case "hourly":
        // 시간 단위로 정규화
        return new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          date.getHours()
        ).getTime();

      case "daily": {
        // 3시간 단위로 정규화 (02, 05, 08, 11, 14, 17, 20, 23시)
        const hour = Math.floor(date.getHours() / 3) * 3;
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour).getTime();
      }

      case "airQuality":
        // 시간 단위로 정규화
        return new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          date.getHours()
        ).getTime();
    }
  }

  /**
   * 현재 날씨 데이터 조회
   */
  async getNow(locationId: string): Promise<WeatherNow | null> {
    await this.init();

    try {
      // 캐시 조회 (정규화된 baseTime 사용)
      const normalizedBaseTime = this.normalizeBaseTime(Date.now(), "now");
      const cached = await weatherCache.getNow(locationId, normalizedBaseTime);
      if (cached && !cached.isStale) {
        return cached.data;
      }

      // 캐시 미스 또는 stale - API 호출
      let location = await weatherCache.getLocation(locationId);
      if (!location) {
        // 기본 위치인 경우 기본 위치 정보 생성
        if (locationId === "default") {
          location = {
            id: "default",
            lat: 37.5139,
            lon: 127.1025,
            name: "서울 송파구 잠실동",
            nx: 62,
            ny: 124,
            tmX: 961114,
            tmY: 1946434,
            timezone: "Asia/Seoul",
            updatedAt: Date.now(),
          };
          // 캐시에 기본 위치 저장
          await weatherCache.setLocation(location);
        } else {
          console.warn(`Location not found for locationId: ${locationId}`);
          return cached?.data || null;
        }
      }

      const now = await this.kmaProvider.getCurrentWeather(location);

      if (now) {
        const baseTime = this.normalizeBaseTime(Date.now(), "now");
        await weatherCache.setNow(locationId, baseTime, now);
      }

      return now;
    } catch (error) {
      console.error("Failed to get current weather:", error);
      // 에러 시 캐시된 데이터 반환 (있으면)
      try {
        const normalizedBaseTime = this.normalizeBaseTime(Date.now(), "now");
        const cached = await weatherCache.getNow(locationId, normalizedBaseTime);
        return cached?.data || null;
      } catch (cacheError) {
        console.error("Failed to get cached weather data:", cacheError);
        return null;
      }
    }
  }

  /**
   * 시간별 날씨 데이터 조회
   */
  async getHourly(locationId: string): Promise<WeatherHourlyPoint[] | null> {
    await this.init();

    try {
      const normalizedBaseTime = this.normalizeBaseTime(Date.now(), "hourly");
      const cached = await weatherCache.getHourly(locationId, normalizedBaseTime);
      if (cached && !cached.isStale) {
        return cached.data;
      }

      let location = await weatherCache.getLocation(locationId);
      if (!location) {
        // 기본 위치인 경우 기본 위치 정보 생성
        if (locationId === "default") {
          location = {
            id: "default",
            lat: 37.5139,
            lon: 127.1025,
            name: "서울 송파구 잠실동",
            nx: 62,
            ny: 124,
            tmX: 961114,
            tmY: 1946434,
            timezone: "Asia/Seoul",
            updatedAt: Date.now(),
          };
          // 캐시에 기본 위치 저장
          await weatherCache.setLocation(location);
        } else {
          console.warn(`Location not found for locationId: ${locationId}`);
          return cached?.data || null;
        }
      }

      const hourly = await this.kmaProvider.getHourlyForecast24h(location);
      if (hourly) {
        const baseTime = this.normalizeBaseTime(Date.now(), "hourly");
        await weatherCache.setHourly(locationId, baseTime, hourly);
      }

      return hourly;
    } catch (error) {
      console.error("Failed to get hourly weather:", error);
      try {
        const normalizedBaseTime = this.normalizeBaseTime(Date.now(), "hourly");
        const cached = await weatherCache.getHourly(locationId, normalizedBaseTime);
        return cached?.data || null;
      } catch (cacheError) {
        console.error("Failed to get cached hourly weather:", cacheError);
        return null;
      }
    }
  }

  /**
   * 일별 날씨 데이터 조회
   */
  async getDaily(locationId: string): Promise<WeatherDailyPoint[] | null> {
    await this.init();

    try {
      const normalizedBaseTime = this.normalizeBaseTime(Date.now(), "daily");
      const cached = await weatherCache.getDaily(locationId, normalizedBaseTime);
      if (cached && !cached.isStale) {
        return cached.data;
      }

      const location = await weatherCache.getLocation(locationId);
      if (!location) {
        console.warn(`Location not found for locationId: ${locationId}`);
        return cached?.data || null;
      }

      const daily = await this.kmaProvider.getDailyForecast7d(location);
      if (daily) {
        const baseTime = this.normalizeBaseTime(Date.now(), "daily");
        await weatherCache.setDaily(locationId, baseTime, daily);
      }

      return daily;
    } catch (error) {
      console.error("Failed to get daily weather:", error);
      try {
        const normalizedBaseTime = this.normalizeBaseTime(Date.now(), "daily");
        const cached = await weatherCache.getDaily(locationId, normalizedBaseTime);
        return cached?.data || null;
      } catch (cacheError) {
        console.error("Failed to get cached daily weather:", cacheError);
        return null;
      }
    }
  }

  /**
   * 대기질 데이터 조회
   */
  async getAirQuality(locationId: string): Promise<AirQuality | null> {
    await this.init();

    try {
      const normalizedBaseTime = this.normalizeBaseTime(Date.now(), "airQuality");
      const cached = await weatherCache.getAirQuality(locationId, normalizedBaseTime);
      if (cached && !cached.isStale) {
        return cached.data;
      }

      let location = await weatherCache.getLocation(locationId);
      if (!location) {
        // 기본 위치인 경우 기본 위치 정보 생성
        if (locationId === "default") {
          location = {
            id: "default",
            lat: 37.5139,
            lon: 127.1025,
            name: "서울 송파구 잠실동",
            nx: 62,
            ny: 124,
            tmX: 961114,
            tmY: 1946434,
            timezone: "Asia/Seoul",
            updatedAt: Date.now(),
          };
          // 캐시에 기본 위치 저장
          await weatherCache.setLocation(location);
        } else {
          console.warn(`Location not found for locationId: ${locationId}`);
          return cached?.data || null;
        }
      }

      const airQuality = await this.airKoreaProvider.getAirQualityByLocation(
        location.lat,
        location.lon
      );
      if (airQuality) {
        const baseTime = this.normalizeBaseTime(Date.now(), "airQuality");
        await weatherCache.setAirQuality(locationId, baseTime, airQuality);
      }

      return airQuality;
    } catch (error) {
      console.error("Failed to get air quality:", error);
      try {
        const normalizedBaseTime = this.normalizeBaseTime(Date.now(), "airQuality");
        const cached = await weatherCache.getAirQuality(locationId, normalizedBaseTime);
        return cached?.data || null;
      } catch (cacheError) {
        console.error("Failed to get cached air quality:", cacheError);
        return null;
      }
    }
  }

  /**
   * 위치 정보 조회 또는 생성
   */
  async getOrCreateLocation(lat: number, lon: number): Promise<WeatherLocation> {
    await this.init();

    const locationId = this.generateLocationId(lat, lon);

    // 캐시에서 위치 정보 조회
    let location = await weatherCache.getLocation(locationId);
    if (location) {
      // 캐시된 location이 완전한지 확인 (nx, ny 속성들이 있는지)
      if (
        location.nx === undefined ||
        location.ny === undefined ||
        location.tmX === undefined ||
        location.tmY === undefined
      ) {
        console.log("Cached location is incomplete, updating with calculated coordinates");
        // 누락된 속성들 계산해서 업데이트
        const { nx, ny } = latLonToGrid(location.lat, location.lon);
        const { tmX, tmY } = latLonToTM(location.lat, location.lon);

        const updatedLocation = {
          ...location,
          nx,
          ny,
          tmX,
          tmY,
          timezone: location.timezone || "Asia/Seoul",
        };

        await weatherCache.setLocation(updatedLocation);
        return updatedLocation;
      }
      return location;
    }

    // 없으면 역지오코딩으로 생성
    try {
      const address = await this.vworldProvider.reverseGeocode(lat, lon);
      const { nx, ny } = latLonToGrid(lat, lon);
      const { tmX, tmY } = latLonToTM(lat, lon);

      location = {
        id: locationId,
        lat,
        lon,
        nx,
        ny,
        tmX,
        tmY,
        timezone: "Asia/Seoul",
        name: address || `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        updatedAt: Date.now(),
      };

      await weatherCache.setLocation(location);
      return location;
    } catch (error) {
      console.error("Failed to create location:", error);
      // 역지오코딩 실패 시 기본 위치 정보 생성
      const { nx, ny } = latLonToGrid(lat, lon);
      const { tmX, tmY } = latLonToTM(lat, lon);

      location = {
        id: locationId,
        lat,
        lon,
        nx,
        ny,
        tmX,
        tmY,
        timezone: "Asia/Seoul",
        name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        updatedAt: Date.now(),
      };

      await weatherCache.setLocation(location);
      return location;
    }
  }

  /**
   * 캐시된 데이터가 있는지 확인
   */
  async hasCachedData(locationId: string): Promise<boolean> {
    await this.init();

    const nowBaseTime = this.normalizeBaseTime(Date.now(), "now");
    const hourlyBaseTime = this.normalizeBaseTime(Date.now(), "hourly");
    const dailyBaseTime = this.normalizeBaseTime(Date.now(), "daily");
    const airQualityBaseTime = this.normalizeBaseTime(Date.now(), "airQuality");

    const [now, hourly, daily, airQuality] = await Promise.all([
      weatherCache.getNow(locationId, nowBaseTime),
      weatherCache.getHourly(locationId, hourlyBaseTime),
      weatherCache.getDaily(locationId, dailyBaseTime),
      weatherCache.getAirQuality(locationId, airQualityBaseTime),
    ]);

    return !!(now || hourly || daily || airQuality);
  }

  /**
   * 캐시 정리
   */
  async cleanup(): Promise<void> {
    await this.init();
    await weatherCache.cleanupExpiredCache();
  }
}

// 설정에서 API 키들을 가져오는 헬퍼 함수
function getWeatherConfig(): WeatherRepositoryConfig {
  const kmaApiKey = import.meta.env.VITE_KMA_SERVICE_KEY;
  const airKoreaApiKey = import.meta.env.VITE_AIRKOREA_SERVICE_KEY;
  const vworldApiKey = import.meta.env.VITE_VWORLD_API_KEY;

  // API 키가 없어도 일단 빈 문자열로 진행 (캐시된 데이터나 기본값 사용)
  return {
    kmaApiKey: kmaApiKey || "",
    airKoreaApiKey: airKoreaApiKey || "",
    vworldApiKey: vworldApiKey || "",
  };
}

// 싱글톤 인스턴스
export const weatherRepository = new WeatherRepository(getWeatherConfig());
