/**
 * Weather Repository
 * IndexedDB cache + external API providers orchestration.
 */

import type { AirQuality, WeatherDailyPoint, WeatherHourlyPoint, WeatherLocation, WeatherNow } from "@/domain/types";
import { weatherCache } from "@/infrastructure/weather/cache/IndexedDbWeatherCache";
import { AirKoreaProvider } from "@/infrastructure/weather/clients/AirKoreaClient";
import { KmaWeatherProvider } from "@/infrastructure/weather/clients/kma/KmaWeatherClient";
import { VWorldGeocodingProvider } from "@/infrastructure/weather/clients/VWorldGeocodingClient";
import {
  getYesterdayKstYmd,
  kstYmdToMidnightBaseTime,
  normalizeBaseTime,
} from "@/lib/weather/utils/baseTime";
import { combineDaily, splitDailyForCache } from "./dailySplit";
import { getAirQualityForLocation } from "./airQuality";
import { defaultIsOnline } from "./online";
import { getLocationOrDefault, getOrCreateLocation } from "./location";
import { swrWithLocation } from "./swr";
import type {
  IWeatherRepository,
  WeatherRepositoryConfig,
  WeatherRepositoryDeps,
  WeatherRepositoryOverrides,
} from "./types";

export type {
  AirKoreaProviderLike,
  IWeatherRepository,
  KmaProviderLike,
  VWorldProviderLike,
  WeatherCache,
  WeatherCacheExact,
  WeatherCacheLatest,
  WeatherLogger,
  WeatherRepositoryConfig,
  WeatherRepositoryDeps,
  WeatherRepositoryOverrides,
} from "./types";

export class WeatherRepository implements IWeatherRepository {
  private readonly deps: WeatherRepositoryDeps;
  private initialized = false;

  constructor(config: WeatherRepositoryConfig, overrides: WeatherRepositoryOverrides = {}) {
    const deps: WeatherRepositoryDeps = {
      cache: weatherCache,
      kmaProvider: new KmaWeatherProvider(config.kmaApiKey),
      airKoreaProvider: new AirKoreaProvider(config.airKoreaApiKey),
      vworldProvider: new VWorldGeocodingProvider(config.vworldApiKey),
      isOnline: defaultIsOnline,
      now: () => Date.now(),
      isDev: import.meta.env.DEV,
      logger: console,
      ...overrides,
    };

    this.deps = deps;
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    await this.deps.cache.init();
    this.initialized = true;
  }

  private baseTime(type: "now" | "hourly" | "daily" | "airQuality", nowMs: number): number {
    return normalizeBaseTime(nowMs, type);
  }

  async getNow(locationId: string): Promise<WeatherNow | null> {
    await this.init();

    const { cache, kmaProvider, isOnline } = this.deps;
    const baseTime = this.baseTime("now", this.deps.now());

    return swrWithLocation({
      exact: () => cache.getNow(locationId, baseTime),
      latest: () => cache.getLatestNow(locationId),
      isOnline,
      getLocation: () => getLocationOrDefault(cache, locationId),
      fetch: (location) => kmaProvider.getCurrentWeather(location),
      set: (data) => cache.setNow(locationId, baseTime, data),
    });
  }

  async getHourly(locationId: string): Promise<WeatherHourlyPoint[] | null> {
    await this.init();

    const { cache, kmaProvider, isOnline } = this.deps;
    const baseTime = this.baseTime("hourly", this.deps.now());

    return swrWithLocation({
      exact: () => cache.getHourly(locationId, baseTime),
      latest: () => cache.getLatestHourly(locationId),
      isOnline,
      getLocation: () => getLocationOrDefault(cache, locationId),
      fetch: (location) => kmaProvider.getHourlyForecast24h(location),
      set: (data) => cache.setHourly(locationId, baseTime, data),
    });
  }

  async getDaily(locationId: string): Promise<WeatherDailyPoint[] | null> {
    await this.init();

    const { cache, kmaProvider } = this.deps;

    const baseTime = this.baseTime("daily", this.deps.now());
    const [shortExact, midExact] = await Promise.all([
      cache.getDaily(locationId, baseTime, "short"),
      cache.getDaily(locationId, baseTime, "mid"),
    ]);

    const shortLatest = shortExact ?? (await cache.getLatestDaily(locationId, "short"));
    const midLatest = midExact ?? (await cache.getLatestDaily(locationId, "mid"));

    const hasFreshBoth =
      shortExact && !shortExact.isStale && midExact && !midExact.isStale;

    if (hasFreshBoth) {
      return combineDaily(shortExact.data, midExact.data);
    }

    if (!this.deps.isOnline()) {
      return combineDaily(shortLatest?.data, midLatest?.data);
    }

    try {
      const location = await getLocationOrDefault(cache, locationId);
      if (!location) {
        return combineDaily(shortLatest?.data, midLatest?.data);
      }

      const daily = await kmaProvider.getDailyForecast7d(location);

      // Split short/mid ranges for caching.
      const { shortTerm, midTerm } = splitDailyForCache(daily, this.deps.now());

      if (shortTerm.length > 0) await cache.setDaily(locationId, baseTime, shortTerm, "short");
      if (midTerm.length > 0) await cache.setDaily(locationId, baseTime, midTerm, "mid");

      return daily;
    } catch {
      return combineDaily(shortLatest?.data, midLatest?.data);
    }
  }

  async getAirQuality(locationId: string): Promise<AirQuality | null> {
    await this.init();

    const { cache, airKoreaProvider, isDev, logger, isOnline } = this.deps;
    const baseTime = this.baseTime("airQuality", this.deps.now());

    return swrWithLocation({
      exact: () => cache.getAirQuality(locationId, baseTime),
      latest: () => cache.getLatestAirQuality(locationId),
      isOnline,
      getLocation: () => getLocationOrDefault(cache, locationId),
      fetch: (location) =>
        getAirQualityForLocation(location, {
          provider: airKoreaProvider,
          isDev,
          logger,
        }),
      set: (data) => cache.setAirQuality(locationId, baseTime, data),
    });
  }

  async getYesterdayHourly(locationId: string, date?: string): Promise<WeatherHourlyPoint[] | null> {
    await this.init();

    const { cache, kmaProvider, isOnline } = this.deps;
    const yesterdayYmd = date || getYesterdayKstYmd();
    const yesterdayBaseTime = kstYmdToMidnightBaseTime(yesterdayYmd);

    return swrWithLocation({
      exact: () => cache.getYesterdayHourly(locationId, yesterdayBaseTime),
      latest: () => cache.getLatestYesterdayHourly(locationId),
      isOnline,
      getLocation: () => getLocationOrDefault(cache, locationId),
      fetch: (location) => kmaProvider.getHourlyForecast24h(location, yesterdayYmd),
      set: (data) => cache.setYesterdayHourly(locationId, yesterdayBaseTime, data),
    });
  }

  async getOrCreateLocation(lat: number, lon: number): Promise<WeatherLocation> {
    await this.init();

    return getOrCreateLocation(this.deps.cache, this.deps.vworldProvider, this.deps.now(), lat, lon);
  }

  async hasCachedData(locationId: string): Promise<boolean> {
    await this.init();

    const { cache } = this.deps;

    const [now, hourly, dailyShort, dailyMid, airQuality] = await Promise.all([
      cache.getLatestNow(locationId),
      cache.getLatestHourly(locationId),
      cache.getLatestDaily(locationId, "short"),
      cache.getLatestDaily(locationId, "mid"),
      cache.getLatestAirQuality(locationId),
    ]);

    return !!(now || hourly || dailyShort || dailyMid || airQuality);
  }

  async cleanup(): Promise<void> {
    await this.init();
    await this.deps.cache.cleanupExpiredCache();
    await this.deps.cache.cleanupExpiredGeocodingCache();
  }
}
