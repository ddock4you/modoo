import type { IDBPDatabase } from "idb";

import type { ModooDB } from "@/lib/storage/db";
import { idbOnly } from "@/lib/weather/utils/idb";
import type { WeatherCacheStoreName } from "./types";

export async function enforceRetentionLimit<StoreName extends WeatherCacheStoreName>(
  db: IDBPDatabase<ModooDB>,
  storeName: StoreName,
  locationId: string,
  maxCount: number,
  devLog: boolean
): Promise<void> {
  try {
    const tx = db.transaction(storeName, "readwrite");
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
      allKeys.push({
        key: cursor.primaryKey as unknown as ModooDB[StoreName]["key"],
        baseTime: value.baseTime,
      });
    }

    allKeys.sort((a, b) => b.baseTime - a.baseTime);

    if (allKeys.length > maxCount) {
      const toDelete = allKeys.slice(maxCount);
      for (const entry of toDelete) {
        await store.delete(entry.key);
      }
      if (devLog) {
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
