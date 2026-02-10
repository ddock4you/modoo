import type { IDBPDatabase } from "idb";

import type { ModooDB } from "@/lib/storage/db";
import { idbUpperBound } from "@/lib/weather/utils/idb";
import type { WeatherCacheStoreName } from "./types";

const DEFAULT_STORES: readonly WeatherCacheStoreName[] = [
  "weather_now",
  "weather_hourly",
  "weather_daily",
  "air_quality",
  "weather_yesterday_hourly",
] as const;

export async function cleanupExpiredCache(
  db: IDBPDatabase<ModooDB>,
  nowMs: number,
  devLog: boolean,
  stores: readonly WeatherCacheStoreName[] = DEFAULT_STORES
): Promise<void> {
  try {
    for (const storeName of stores) {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const index = store.index("byExpiresAt");

      let deletedCount = 0;
      const range = idbUpperBound(nowMs);
      if (!range) {
        await tx.done;
        continue;
      }

      for await (const cursor of index.iterate(range)) {
        await cursor.delete();
        deletedCount++;
      }

      await tx.done;

      if (deletedCount > 0 && devLog) {
        console.log(`Cleaned up ${deletedCount} expired entries from ${storeName}`);
      }
    }
  } catch (error) {
    console.warn("Failed to cleanup expired weather cache:", error);
  }
}
