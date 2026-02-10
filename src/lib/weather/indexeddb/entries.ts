import type { IDBPDatabase } from "idb";

import type { ModooDB } from "@/lib/storage/db";
import type { WeatherCacheResult, WeatherCacheStoreName } from "./types";

export async function getCacheEntry<StoreName extends WeatherCacheStoreName, T>(
  db: IDBPDatabase<ModooDB>,
  storeName: StoreName,
  key: ModooDB[StoreName]["key"],
  nowMs: number = Date.now()
): Promise<WeatherCacheResult<T> | null> {
  try {
    const entry = await db.get(storeName, key);
    if (!entry) return null;

    const typed = entry as unknown as { data: T; expiresAt: number; baseTime?: number };
    const isStale = typed.expiresAt <= nowMs;

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

export async function setCacheEntry<StoreName extends WeatherCacheStoreName>(
  db: IDBPDatabase<ModooDB>,
  storeName: StoreName,
  entry: ModooDB[StoreName]["value"]
): Promise<void> {
  try {
    await db.put(storeName, entry);
  } catch (error) {
    console.warn(`Failed to set cache entry in ${storeName}:`, error);
  }
}
