import type {
  AirQuality,
  WeatherDailyPoint,
  WeatherHourlyPoint,
  WeatherLocation,
  WeatherNow,
} from "@/domain/types";

export interface WeatherRepositoryConfig {
  kmaApiKey: string;
  airKoreaApiKey: string;
  vworldApiKey: string;
}

export interface WeatherLogger {
  warn: (...args: unknown[]) => void;
}

export type WeatherCacheExact<T> = { data: T; isStale: boolean } | null;
export type WeatherCacheLatest<T> = { data: T } | null;

export interface WeatherCache {
  init(): Promise<void>;

  getNow(locationId: string, baseTime: number): Promise<WeatherCacheExact<WeatherNow>>;
  getLatestNow(locationId: string): Promise<WeatherCacheLatest<WeatherNow>>;
  setNow(locationId: string, baseTime: number, data: WeatherNow): Promise<void>;

  getHourly(locationId: string, baseTime: number): Promise<WeatherCacheExact<WeatherHourlyPoint[]>>;
  getLatestHourly(locationId: string): Promise<WeatherCacheLatest<WeatherHourlyPoint[]>>;
  setHourly(locationId: string, baseTime: number, data: WeatherHourlyPoint[]): Promise<void>;

  getDaily(
    locationId: string,
    baseTime: number,
    type: "short" | "mid"
  ): Promise<WeatherCacheExact<WeatherDailyPoint[]>>;
  getLatestDaily(locationId: string, type: "short" | "mid"): Promise<WeatherCacheLatest<WeatherDailyPoint[]>>;
  setDaily(
    locationId: string,
    baseTime: number,
    data: WeatherDailyPoint[],
    type: "short" | "mid"
  ): Promise<void>;

  getAirQuality(locationId: string, baseTime: number): Promise<WeatherCacheExact<AirQuality>>;
  getLatestAirQuality(locationId: string): Promise<WeatherCacheLatest<AirQuality>>;
  setAirQuality(locationId: string, baseTime: number, data: AirQuality): Promise<void>;

  getYesterdayHourly(locationId: string, baseTime: number): Promise<WeatherCacheExact<WeatherHourlyPoint[]>>;
  getLatestYesterdayHourly(locationId: string): Promise<WeatherCacheLatest<WeatherHourlyPoint[]>>;
  setYesterdayHourly(locationId: string, baseTime: number, data: WeatherHourlyPoint[]): Promise<void>;

  getLocation(locationId: string): Promise<WeatherLocation | null>;
  setLocation(location: WeatherLocation): Promise<void>;
  getGeocodingAddress(lat: number, lon: number): Promise<{ data: string; isStale: boolean } | null>;
  setGeocodingAddress(lat: number, lon: number, address: string): Promise<void>;

  cleanupExpiredCache(): Promise<void>;
  cleanupExpiredGeocodingCache(): Promise<void>;
}

export interface KmaProviderLike {
  getCurrentWeather(location: WeatherLocation): Promise<WeatherNow>;
  getHourlyForecast24h(location: WeatherLocation, dateYmd?: string): Promise<WeatherHourlyPoint[]>;
  getDailyForecast7d(location: WeatherLocation): Promise<WeatherDailyPoint[]>;
}

export interface AirKoreaProviderLike {
  getNearbyStations(tmX: number, tmY: number): Promise<Array<{ name: string; distance: number }>>;
  getAirQuality(stationName: string): Promise<AirQuality>;
}

export interface VWorldProviderLike {
  reverseGeocode(lat: number, lon: number): Promise<string>;
}

export type WeatherRepositoryDeps = {
  cache: WeatherCache;
  kmaProvider: KmaProviderLike;
  airKoreaProvider: AirKoreaProviderLike;
  vworldProvider: VWorldProviderLike;
  isOnline: () => boolean;
  now: () => number;
  isDev: boolean;
  logger: WeatherLogger;
};

export type WeatherRepositoryOverrides = Partial<WeatherRepositoryDeps>;

export interface IWeatherRepository {
  init(): Promise<void>;
  getNow(locationId: string): Promise<WeatherNow | null>;
  getHourly(locationId: string): Promise<WeatherHourlyPoint[] | null>;
  getDaily(locationId: string): Promise<WeatherDailyPoint[] | null>;
  getAirQuality(locationId: string): Promise<AirQuality | null>;
  getYesterdayHourly(locationId: string, date?: string): Promise<WeatherHourlyPoint[] | null>;
  getOrCreateLocation(lat: number, lon: number): Promise<WeatherLocation>;
  hasCachedData(locationId: string): Promise<boolean>;
  cleanup(): Promise<void>;
}
