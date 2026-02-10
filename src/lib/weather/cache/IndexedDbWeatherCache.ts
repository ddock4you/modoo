import type { IDBPDatabase } from "idb";
import { initDB, type ModooDB } from "@/lib/storage/db";
import type {
  AirQuality,
  WeatherDailyPoint,
  WeatherHourlyPoint,
  WeatherLocation,
  WeatherNow,
} from "@/domain/types";
import { idbOnly, idbUpperBound } from "@/lib/weather/utils/idb";

export interface WeatherCacheResult<T = unknown> {
  data: T;
  isStale: boolean;
  expiresAt: number;
  // Optional: consumers may use this when selecting a fallback.
  baseTime?: number;
}

type WeatherCacheStoreName =
  | "weather_now"
  | "weather_hourly"
  | "weather_daily"
  | "air_quality"
  | "weather_yesterday_hourly";

/**
 * IndexedDB 기반 날씨 데이터 캐시
 * - TTL 기반 stale 판단
 * - locationId 기반 retention limit 유지
 * - 오프라인 UX를 위한 "latest" 조회 지원
 */
export class IndexedDbWeatherCache {
  private db: IDBPDatabase<ModooDB> | null = null;

  private readonly TTL_MINUTES = {
    now: 10,
    hourly: 60,
    shortTermDaily: 6 * 60,
    midTermDaily: 12 * 60,
    airQuality: 60,
    yesterdayHourly: 24 * 60,
  } as const;

  private readonly MAX_DAYS_PER_LOCATION = 7;

  async init(): Promise<void> {
    if (this.db) return;
    this.db = await initDB();
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
    const expiresAt = Date.now() + this.TTL_MINUTES.now * 60 * 1000;
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
    const expiresAt = Date.now() + this.TTL_MINUTES.hourly * 60 * 1000;
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
    const ttlMinutes = type === "mid" ? this.TTL_MINUTES.midTermDaily : this.TTL_MINUTES.shortTermDaily;
    const expiresAt = Date.now() + ttlMinutes * 60 * 1000;
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
    const expiresAt = Date.now() + this.TTL_MINUTES.airQuality * 60 * 1000;
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
    const expiresAt = Date.now() + this.TTL_MINUTES.yesterdayHourly * 60 * 1000;
    await this.setCacheEntry("weather_yesterday_hourly", { locationId, baseTime, data, expiresAt });
    await this.enforceRetentionLimit("weather_yesterday_hourly", locationId);
  }

  async getLocation(locationId: string): Promise<WeatherLocation | null> {
    await this.init();
    try {
      const location = await this.db!.get("weather_locations", locationId);
      return location || null;
    } catch (error) {
      console.warn("Failed to get weather location:", error);
      return null;
    }
  }

  async setLocation(location: WeatherLocation): Promise<void> {
    await this.init();
    try {
      await this.db!.put("weather_locations", { ...location, updatedAt: Date.now() });
    } catch (error) {
      console.warn("Failed to set weather location:", error);
    }
  }

  async cleanupExpiredCache(): Promise<void> {
    await this.init();

    const now = Date.now();
    const stores = [
      "weather_now",
      "weather_hourly",
      "weather_daily",
      "air_quality",
      "weather_yesterday_hourly",
    ] as const;

    try {
      for (const storeName of stores) {
        const tx = this.db!.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const index = store.index("byExpiresAt");

        let deletedCount = 0;
        const range = idbUpperBound(now);
        if (!range) {
          await tx.done;
          continue;
        }
        for await (const cursor of index.iterate(range)) {
          await cursor.delete();
          deletedCount++;
        }

        await tx.done;

        if (deletedCount > 0 && import.meta.env.DEV) {
          console.log(`Cleaned up ${deletedCount} expired entries from ${storeName}`);
        }
      }
    } catch (error) {
      console.warn("Failed to cleanup expired weather cache:", error);
    }
  }

  private async enforceRetentionLimit<StoreName extends WeatherCacheStoreName>(
    storeName: StoreName,
    locationId: string,
    maxCount: number = this.MAX_DAYS_PER_LOCATION
  ): Promise<void> {
    await this.init();

    try {
      const tx = this.db!.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const index = store.index("byLocationId");

      const allKeys: Array<{ key: ModooDB[StoreName]["key"]; baseTime: number }> = [];
      const only = idbOnly(locationId);
      if (!only) {
        await tx.done;
        return;
      }

      for await (const cursor of index.iterate(only)) {
        const value = cursor.value as unknown as { baseTime: number };
        allKeys.push({ key: cursor.primaryKey as unknown as ModooDB[StoreName]["key"], baseTime: value.baseTime });
      }

      allKeys.sort((a, b) => b.baseTime - a.baseTime);

      if (allKeys.length > maxCount) {
        const toDelete = allKeys.slice(maxCount);
        for (const entry of toDelete) {
          await store.delete(entry.key);
        }
        if (import.meta.env.DEV) {
          console.log(
            `Enforced retention limit: deleted ${toDelete.length} old entries from ${storeName} for location ${locationId}`
          );
        }
      }

      await tx.done;
    } catch (error) {
      console.warn(`Failed to enforce retention limit for ${storeName}:`, error);
    }
  }

  private async getCacheEntry<StoreName extends WeatherCacheStoreName, T>(
    storeName: StoreName,
    key: ModooDB[StoreName]["key"]
  ): Promise<WeatherCacheResult<T> | null> {
    await this.init();

    try {
      const entry = await this.db!.get(storeName, key);
      if (!entry) return null;

      const now = Date.now();
      const typed = entry as unknown as { data: T; expiresAt: number; baseTime?: number };
      const isStale = typed.expiresAt <= now;

      return {
        data: typed.data,
        isStale,
        expiresAt: typed.expiresAt,
        baseTime: typed.baseTime,
      };
    } catch (error) {
      console.warn(`Failed to get cache entry from ${storeName}:`, error);
      return null;
    }
  }

  private async setCacheEntry<StoreName extends WeatherCacheStoreName>(
    storeName: StoreName,
    entry: ModooDB[StoreName]["value"]
  ): Promise<void> {
    await this.init();
    try {
      await this.db!.put(storeName, entry);
    } catch (error) {
      console.warn(`Failed to set cache entry in ${storeName}:`, error);
    }
  }

  private async getLatestCacheEntry<StoreName extends Exclude<WeatherCacheStoreName, "weather_daily">, T>(
    storeName: StoreName,
    locationId: string
  ): Promise<WeatherCacheResult<T> | null> {
    await this.init();

    try {
      const tx = this.db!.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const index = store.index("byLocationId");
      const only = idbOnly(locationId);

      if (!only) {
        await tx.done;
        return null;
      }

      for await (const cursor of index.iterate(only, "prev")) {
        const value = cursor.value as unknown as { data: T; expiresAt: number; baseTime?: number };
        const isStale = value.expiresAt <= Date.now();
        await tx.done;
        return { data: value.data, isStale, expiresAt: value.expiresAt, baseTime: value.baseTime };
      }

      await tx.done;
      return null;
    } catch (error) {
      console.warn(`Failed to get latest cache entry from ${storeName}:`, error);
      return null;
    }
  }

  private async getLatestDailyByType(
    locationId: string,
    type: "short" | "mid"
  ): Promise<WeatherCacheResult<WeatherDailyPoint[]> | null> {
    await this.init();

    try {
      const tx = this.db!.transaction("weather_daily", "readonly");
      const store = tx.objectStore("weather_daily");
      const index = store.index("byLocationId");
      const only = idbOnly(locationId);
      if (!only) {
        await tx.done;
        return null;
      }

      let best: { baseTime: number; data: WeatherDailyPoint[]; expiresAt: number } | null = null;
      for await (const cursor of index.iterate(only)) {
        const value = cursor.value as unknown as {
          type: "short" | "mid";
          baseTime: number;
          data: WeatherDailyPoint[];
          expiresAt: number;
        };
        if (value.type !== type) continue;
        if (!best || value.baseTime > best.baseTime) {
          best = { baseTime: value.baseTime, data: value.data, expiresAt: value.expiresAt };
        }
      }

      await tx.done;

      if (!best) return null;
      return {
        data: best.data,
        isStale: best.expiresAt <= Date.now(),
        expiresAt: best.expiresAt,
        baseTime: best.baseTime,
      };
    } catch (error) {
      console.warn("Failed to get latest daily cache:", error);
      return null;
    }
  }
}

export const weatherCache = new IndexedDbWeatherCache();
