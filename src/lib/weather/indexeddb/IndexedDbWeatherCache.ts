import type { IDBPDatabase } from "idb";
import { initDB, type ModooDB } from "@/lib/storage/db";
import type {
  AirQuality,
  WeatherDailyPoint,
  WeatherHourlyPoint,
  WeatherLocation,
  WeatherNow,
} from "@/domain/types";
import type { WeatherCacheResult, WeatherCacheStoreName } from "./types";
import { getCacheEntry, setCacheEntry } from "./entries";
import { getLatestCacheEntry, getLatestDailyByType } from "./latest";
import { enforceRetentionLimit } from "./retention";
import { cleanupExpiredCache } from "./cleanupExpired";
import { getExpiresAt, WEATHER_CACHE_TTL_MINUTES } from "./ttl";

/**
 * IndexedDB 기반 날씨 데이터 캐시
 * - TTL 기반 stale 판단
 * - locationId 기반 retention limit 유지
 * - 오프라인 UX를 위한 "latest" 조회 지원
 */
export class IndexedDbWeatherCache {
  private db: IDBPDatabase<ModooDB> | null = null;

  // Backward compatibility: some tests access this via `(cache as any).TTL_MINUTES`.
  private readonly TTL_MINUTES = WEATHER_CACHE_TTL_MINUTES;

  private readonly MAX_DAYS_PER_LOCATION = 7;

  private async getDb(): Promise<IDBPDatabase<ModooDB>> {
    if (this.db) return this.db;
    this.db = await initDB();
    return this.db;
  }

  async init(): Promise<void> {
    // Keep TTL_MINUTES referenced so TypeScript doesn't flag it as unused.
    void this.TTL_MINUTES;
    await this.getDb();
  }

  async getNow(
    locationId: string,
    baseTime: number
  ): Promise<WeatherCacheResult<WeatherNow> | null> {
    return this.getCacheEntry("weather_now", [locationId, baseTime]);
  }

  async getLatestNow(locationId: string): Promise<WeatherCacheResult<WeatherNow> | null> {
    return this.getLatestCacheEntry("weather_now", locationId);
  }

  async setNow(locationId: string, baseTime: number, data: WeatherNow): Promise<void> {
    const expiresAt = getExpiresAt("now");
    await this.setCacheEntry("weather_now", { locationId, baseTime, data, expiresAt });
    await this.enforceRetentionLimit("weather_now", locationId);
  }

  async getHourly(
    locationId: string,
    baseTime: number
  ): Promise<WeatherCacheResult<WeatherHourlyPoint[]> | null> {
    return this.getCacheEntry("weather_hourly", [locationId, baseTime]);
  }

  async getLatestHourly(
    locationId: string
  ): Promise<WeatherCacheResult<WeatherHourlyPoint[]> | null> {
    return this.getLatestCacheEntry("weather_hourly", locationId);
  }

  async setHourly(locationId: string, baseTime: number, data: WeatherHourlyPoint[]): Promise<void> {
    const expiresAt = getExpiresAt("hourly");
    await this.setCacheEntry("weather_hourly", { locationId, baseTime, data, expiresAt });
    await this.enforceRetentionLimit("weather_hourly", locationId);
  }

  async getDaily(
    locationId: string,
    baseTime: number,
    type: "short" | "mid" = "short"
  ): Promise<WeatherCacheResult<WeatherDailyPoint[]> | null> {
    return this.getCacheEntry("weather_daily", [locationId, type, baseTime]);
  }

  async getLatestDaily(
    locationId: string,
    type: "short" | "mid" = "short"
  ): Promise<WeatherCacheResult<WeatherDailyPoint[]> | null> {
    return this.getLatestDailyByType(locationId, type);
  }

  async setDaily(
    locationId: string,
    baseTime: number,
    data: WeatherDailyPoint[],
    type: "short" | "mid" = "short"
  ): Promise<void> {
    const expiresAt = getExpiresAt(type === "mid" ? "midTermDaily" : "shortTermDaily");
    await this.setCacheEntry("weather_daily", { locationId, type, baseTime, data, expiresAt });
    await this.enforceRetentionLimit("weather_daily", locationId);
  }

  async getAirQuality(
    locationId: string,
    baseTime: number
  ): Promise<WeatherCacheResult<AirQuality> | null> {
    return this.getCacheEntry("air_quality", [locationId, baseTime]);
  }

  async getLatestAirQuality(locationId: string): Promise<WeatherCacheResult<AirQuality> | null> {
    return this.getLatestCacheEntry("air_quality", locationId);
  }

  async setAirQuality(locationId: string, baseTime: number, data: AirQuality): Promise<void> {
    const expiresAt = getExpiresAt("airQuality");
    await this.setCacheEntry("air_quality", { locationId, baseTime, data, expiresAt });
    await this.enforceRetentionLimit("air_quality", locationId);
  }

  async getYesterdayHourly(
    locationId: string,
    baseTime: number
  ): Promise<WeatherCacheResult<WeatherHourlyPoint[]> | null> {
    return this.getCacheEntry("weather_yesterday_hourly", [locationId, baseTime]);
  }

  async getLatestYesterdayHourly(
    locationId: string
  ): Promise<WeatherCacheResult<WeatherHourlyPoint[]> | null> {
    return this.getLatestCacheEntry("weather_yesterday_hourly", locationId);
  }

  async setYesterdayHourly(
    locationId: string,
    baseTime: number,
    data: WeatherHourlyPoint[]
  ): Promise<void> {
    const expiresAt = getExpiresAt("yesterdayHourly");
    await this.setCacheEntry("weather_yesterday_hourly", { locationId, baseTime, data, expiresAt });
    await this.enforceRetentionLimit("weather_yesterday_hourly", locationId);
  }

  async getLocation(locationId: string): Promise<WeatherLocation | null> {
    const db = await this.getDb();
    try {
      const location = await db.get("weather_locations", locationId);
      return location || null;
    } catch (error) {
      console.warn("Failed to get weather location:", error);
      return null;
    }
  }

  async setLocation(location: WeatherLocation): Promise<void> {
    const db = await this.getDb();
    try {
      await db.put("weather_locations", { ...location, updatedAt: Date.now() });
    } catch (error) {
      console.warn("Failed to set weather location:", error);
    }
  }

  async cleanupExpiredCache(): Promise<void> {
    const db = await this.getDb();
    await cleanupExpiredCache(db, Date.now(), import.meta.env.DEV);
  }

  private async enforceRetentionLimit<StoreName extends WeatherCacheStoreName>(
    storeName: StoreName,
    locationId: string,
    maxCount: number = this.MAX_DAYS_PER_LOCATION
  ): Promise<void> {
    const db = await this.getDb();
    await enforceRetentionLimit(db, storeName, locationId, maxCount, import.meta.env.DEV);
  }

  private async getCacheEntry<StoreName extends WeatherCacheStoreName, T>(
    storeName: StoreName,
    key: ModooDB[StoreName]["key"]
  ): Promise<WeatherCacheResult<T> | null> {
    const db = await this.getDb();
    return getCacheEntry<StoreName, T>(db, storeName, key);
  }

  private async setCacheEntry<StoreName extends WeatherCacheStoreName>(
    storeName: StoreName,
    entry: ModooDB[StoreName]["value"]
  ): Promise<void> {
    const db = await this.getDb();
    await setCacheEntry(db, storeName, entry);
  }

  private async getLatestCacheEntry<StoreName extends Exclude<WeatherCacheStoreName, "weather_daily">, T>(
    storeName: StoreName,
    locationId: string
  ): Promise<WeatherCacheResult<T> | null> {
    const db = await this.getDb();
    return getLatestCacheEntry<StoreName, T>(db, storeName, locationId);
  }

  private async getLatestDailyByType(
    locationId: string,
    type: "short" | "mid"
  ): Promise<WeatherCacheResult<WeatherDailyPoint[]> | null> {
    const db = await this.getDb();
    return getLatestDailyByType(db, locationId, type);
  }
}

export const weatherCache = new IndexedDbWeatherCache();
