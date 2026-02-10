import type { IDBPDatabase } from "idb";

import type { WeatherDailyPoint } from "@/domain/types";
import type { ModooDB } from "@/lib/storage/db";
import { idbOnly } from "@/lib/weather/utils/idb";
import type { WeatherCacheResult, WeatherCacheStoreName } from "./types";

export async function getLatestCacheEntry<StoreName extends Exclude<WeatherCacheStoreName, "weather_daily">, T>(
  db: IDBPDatabase<ModooDB>,
  storeName: StoreName,
  locationId: string
): Promise<WeatherCacheResult<T> | null> {
  try {
    const tx = db.transaction(storeName, "readonly");
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

export async function getLatestDailyByType(
  db: IDBPDatabase<ModooDB>,
  locationId: string,
  type: "short" | "mid"
): Promise<WeatherCacheResult<WeatherDailyPoint[]> | null> {
  try {
    const tx = db.transaction("weather_daily", "readonly");
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
