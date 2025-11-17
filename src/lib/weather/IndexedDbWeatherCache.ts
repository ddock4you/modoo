import { initDB } from "../storage/db";
import type {
  WeatherLocation,
  WeatherNow,
  WeatherHourlyPoint,
  WeatherDailyPoint,
  AirQuality,
  WeatherCacheEntry,
} from "../../domain/types";

// Weather 전용 DB 타입
export interface WeatherDB {
  weather_now: WeatherCacheEntry;
  weather_hourly: WeatherCacheEntry;
  weather_daily: WeatherCacheEntry;
  air_quality: WeatherCacheEntry;
  weather_locations: WeatherLocation;
  weather_geocoding_cache: {
    key: string;
    address: string;
    lat: number;
    lon: number;
    expiresAt: number;
  };
}

export interface WeatherCacheResult<T = any> {
  data: T;
  isStale: boolean;
  expiresAt: number;
}

/**
 * IndexedDB 기반 날씨 데이터 캐시 관리 클래스
 * TTL 기반 캐시 관리 및 SWR 패턴을 지원합니다.
 */
export class IndexedDbWeatherCache {
  private db: any = null;

  // TTL 설정 (분 단위)
  private readonly TTL_MINUTES = {
    now: 10, // 현재 날씨: 10분
    hourly: 60, // 시간별: 60분
    shortTermDaily: 6 * 60, // 단기예보 일별: 6시간
    midTermDaily: 12 * 60, // 중기예보 일별: 12시간
    airQuality: 60, // 대기질: 60분
  } as const;

  // 위치별 최대 보존 일수
  private readonly MAX_DAYS_PER_LOCATION = 7;

  async init(): Promise<void> {
    this.db = (await initDB()) as unknown as WeatherDB;
  }

  /**
   * 현재 날씨 데이터 캐시 조회
   */
  async getNow(
    locationId: string,
    baseTime: number
  ): Promise<WeatherCacheResult<WeatherNow> | null> {
    return this.getCacheEntry("weather_now", locationId, baseTime);
  }

  /**
   * 현재 날씨 데이터 캐시 저장
   */
  async setNow(locationId: string, baseTime: number, data: WeatherNow): Promise<void> {
    const expiresAt = Date.now() + this.TTL_MINUTES.now * 60 * 1000;
    await this.setCacheEntry("weather_now", {
      locationId,
      baseTime,
      data,
      expiresAt,
    });

    // 위치별 데이터 수 제한
    await this.enforceRetentionLimit("weather_now", locationId);
  }

  /**
   * 시간별 날씨 데이터 캐시 조회
   */
  async getHourly(
    locationId: string,
    baseTime: number
  ): Promise<WeatherCacheResult<WeatherHourlyPoint[]> | null> {
    return this.getCacheEntry("weather_hourly", locationId, baseTime);
  }

  /**
   * 시간별 날씨 데이터 캐시 저장
   */
  async setHourly(locationId: string, baseTime: number, data: WeatherHourlyPoint[]): Promise<void> {
    const expiresAt = Date.now() + this.TTL_MINUTES.hourly * 60 * 1000;
    await this.setCacheEntry("weather_hourly", {
      locationId,
      baseTime,
      data,
      expiresAt,
    });

    // 위치별 데이터 수 제한
    await this.enforceRetentionLimit("weather_hourly", locationId);
  }

  /**
   * 일별 날씨 데이터 캐시 조회
   */
  async getDaily(
    locationId: string,
    baseTime: number,
    _type: "short" | "mid" = "short" // 현재 구현에서는 사용하지 않음
  ): Promise<WeatherCacheResult<WeatherDailyPoint[]> | null> {
    // type 파라미터는 현재 사용하지 않음
    return this.getCacheEntry("weather_daily", locationId, baseTime);
  }

  /**
   * 일별 날씨 데이터 캐시 저장
   */
  async setDaily(
    locationId: string,
    baseTime: number,
    data: WeatherDailyPoint[],
    type: "short" | "mid" = "short"
  ): Promise<void> {
    const ttlMinutes =
      type === "mid" ? this.TTL_MINUTES.midTermDaily : this.TTL_MINUTES.shortTermDaily;
    const expiresAt = Date.now() + ttlMinutes * 60 * 1000;

    await this.setCacheEntry("weather_daily", {
      locationId,
      baseTime,
      data,
      expiresAt,
    });

    // 위치별 데이터 수 제한
    await this.enforceRetentionLimit("weather_daily", locationId);
  }

  /**
   * 대기질 데이터 캐시 조회
   */
  async getAirQuality(
    locationId: string,
    baseTime: number
  ): Promise<WeatherCacheResult<AirQuality> | null> {
    return this.getCacheEntry("air_quality", locationId, baseTime);
  }

  /**
   * 대기질 데이터 캐시 저장
   */
  async setAirQuality(locationId: string, baseTime: number, data: AirQuality): Promise<void> {
    const expiresAt = Date.now() + this.TTL_MINUTES.airQuality * 60 * 1000;
    await this.setCacheEntry("air_quality", {
      locationId,
      baseTime,
      data,
      expiresAt,
    });

    // 위치별 데이터 수 제한
    await this.enforceRetentionLimit("air_quality", locationId);
  }

  /**
   * 위치 정보 조회
   */
  async getLocation(locationId: string): Promise<WeatherLocation | null> {
    if (!this.db) await this.init();

    try {
      const location = await this.db!.get("weather_locations", locationId);
      return location || null;
    } catch (error) {
      console.warn("Failed to get weather location:", error);
      return null;
    }
  }

  /**
   * 위치 정보 저장
   */
  async setLocation(location: WeatherLocation): Promise<void> {
    if (!this.db) await this.init();

    try {
      await this.db!.put("weather_locations", {
        ...location,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.warn("Failed to set weather location:", error);
    }
  }

  /**
   * 만료된 캐시 정리
   */
  async cleanupExpiredCache(): Promise<void> {
    if (!this.db) await this.init();

    const now = Date.now();
    const stores = ["weather_now", "weather_hourly", "weather_daily", "air_quality"] as const;

    try {
      for (const storeName of stores) {
        const tx = this.db!.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const index = store.index("byExpiresAt");

        let deletedCount = 0;
        for await (const cursor of index.iterate(null, IDBKeyRange.upperBound(now))) {
          await cursor.delete();
          deletedCount++;
        }

        await tx.done;

        if (deletedCount > 0) {
          if (import.meta.env.DEV) {
            console.log(`Cleaned up ${deletedCount} expired entries from ${storeName}`);
          }
        }
      }
    } catch (error) {
      console.warn("Failed to cleanup expired weather cache:", error);
    }
  }

  /**
   * 위치별 데이터 수 제한 적용
   */
  private async enforceRetentionLimit(
    storeName: keyof Pick<
      WeatherDB,
      "weather_now" | "weather_hourly" | "weather_daily" | "air_quality"
    >,
    locationId: string
  ): Promise<void> {
    if (!this.db) await this.init();

    try {
      const tx = this.db!.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const index = store.index("byLocationId");

      // 해당 위치의 모든 데이터를 baseTime 내림차순으로 조회
      const allEntries: Array<{ key: [string, number]; value: WeatherCacheEntry }> = [];
      for await (const cursor of index.iterate(locationId)) {
        allEntries.push({
          key: cursor.primaryKey as [string, number],
          value: cursor.value as WeatherCacheEntry,
        });
      }

      // baseTime 기준 내림차순 정렬 (최신 데이터가 먼저)
      allEntries.sort((a, b) => b.key[1] - a.key[1]);

      // 제한 수를 초과하는 오래된 데이터 삭제
      if (allEntries.length > this.MAX_DAYS_PER_LOCATION) {
        const toDelete = allEntries.slice(this.MAX_DAYS_PER_LOCATION);
        for (const entry of toDelete) {
          await store.delete(entry.key);
        }
        console.log(
          `Enforced retention limit: deleted ${toDelete.length} old entries from ${storeName} for location ${locationId}`
        );
      }

      await tx.done;
    } catch (error) {
      console.warn(`Failed to enforce retention limit for ${storeName}:`, error);
    }
  }

  /**
   * 캐시 엔트리 조회 (공통)
   */
  private async getCacheEntry<T>(
    storeName: keyof Pick<
      WeatherDB,
      "weather_now" | "weather_hourly" | "weather_daily" | "air_quality"
    >,
    locationId: string,
    baseTime: number
  ): Promise<WeatherCacheResult<T> | null> {
    if (!this.db) await this.init();

    try {
      // 키 생성
      const key = [locationId, baseTime];
      const entry = await this.db!.get(storeName, key);
      if (!entry) return null;

      const now = Date.now();
      const isStale = entry.expiresAt <= now;

      return {
        data: entry.data,
        isStale,
        expiresAt: entry.expiresAt,
      };
    } catch (error) {
      console.warn(`Failed to get cache entry from ${storeName}:`, error);
      return null;
    }
  }

  /**
   * 캐시 엔트리 저장 (공통)
   */
  private async setCacheEntry(
    storeName: keyof Pick<
      WeatherDB,
      "weather_now" | "weather_hourly" | "weather_daily" | "air_quality"
    >,
    entry: WeatherCacheEntry
  ): Promise<void> {
    if (!this.db) await this.init();

    try {
      await this.db!.put(storeName, entry);
    } catch (error) {
      console.warn(`Failed to set cache entry in ${storeName}:`, error);
    }
  }
}

// 싱글톤 인스턴스
export const weatherCache = new IndexedDbWeatherCache();
