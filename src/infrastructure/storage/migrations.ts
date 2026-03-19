import type { IDBPDatabase, IDBPTransaction } from "idb";
import type { ModooDB } from "./schema";

export const DB_NAME = "modoo" as const;
export const DB_VERSION = 7 as const;

export function upgradeDb(
  db: IDBPDatabase<ModooDB>,
  oldVersion: number,
  _newVersion: number | null,
  transaction: IDBPTransaction<ModooDB, any, "versionchange">
): void {
  if (oldVersion < 1) {
    const plantsStore = db.createObjectStore("plants", { keyPath: "id" });
    plantsStore.createIndex("byName", "name");
    plantsStore.createIndex("byAdoptedAt", "adoptedAt");

    const rulesStore = db.createObjectStore("taskRules", { keyPath: "id" });
    rulesStore.createIndex("byPlantId", "plantId");
    rulesStore.createIndex("byType", "type");
    rulesStore.createIndex("byNextDueAt", "nextDueAt");
    rulesStore.createIndex("byActiveAndNextDueAt", ["active", "nextDueAt"]);
    rulesStore.createIndex("byPlantIdTypeActive", ["plantId", "type", "active"]);

    const eventsStore = db.createObjectStore("taskEvents", { keyPath: "id" });
    eventsStore.createIndex("byPlantId", "plantId");
    eventsStore.createIndex("byType", "type");
    eventsStore.createIndex("byDoneAt", "doneAt");
    eventsStore.createIndex("byPlantIdAndDoneAt", ["plantId", "doneAt"]);
    eventsStore.createIndex("byTypeAndDoneAt", ["type", "doneAt"]);
    eventsStore.createIndex("byPlantIdTypeAndDoneAt", ["plantId", "type", "doneAt"]);

    const photosStore = db.createObjectStore("photos", { keyPath: "id" });
    photosStore.createIndex("byPlantId", "plantId");
    photosStore.createIndex("byCreatedAt", "createdAt");

    db.createObjectStore("settings", { keyPath: "key" });
  }

  if (oldVersion < 2) {
    const photosBlobsStore = db.createObjectStore("photos_blobs", { keyPath: "id" });
    photosBlobsStore.createIndex("byPlantId", "plantId");
    photosBlobsStore.createIndex("byCreatedAt", "createdAt");
  }

  if (oldVersion < 3) {
    const geocodingCacheStore = db.createObjectStore("weather_geocoding_cache", { keyPath: "key" });
    geocodingCacheStore.createIndex("byExpiresAt", "expiresAt");
  }

  if (oldVersion < 4) {
    const weatherNowStore = db.createObjectStore("weather_now", { keyPath: ["locationId", "baseTime"] });
    weatherNowStore.createIndex("byExpiresAt", "expiresAt");
    weatherNowStore.createIndex("byLocationId", "locationId");

    const weatherHourlyStore = db.createObjectStore("weather_hourly", { keyPath: ["locationId", "baseTime"] });
    weatherHourlyStore.createIndex("byExpiresAt", "expiresAt");
    weatherHourlyStore.createIndex("byLocationId", "locationId");

    const weatherDailyStore = db.createObjectStore("weather_daily", { keyPath: ["locationId", "type", "baseTime"] });
    weatherDailyStore.createIndex("byExpiresAt", "expiresAt");
    weatherDailyStore.createIndex("byLocationId", "locationId");
    weatherDailyStore.createIndex("byType", "type");

    const airQualityStore = db.createObjectStore("air_quality", { keyPath: ["locationId", "baseTime"] });
    airQualityStore.createIndex("byExpiresAt", "expiresAt");
    airQualityStore.createIndex("byLocationId", "locationId");

    const weatherLocationsStore = db.createObjectStore("weather_locations", { keyPath: "id" });
    weatherLocationsStore.createIndex("byUpdatedAt", "updatedAt");
  }

  if (oldVersion < 5) {
    const weatherYesterdayHourlyStore = db.createObjectStore("weather_yesterday_hourly", {
      keyPath: ["locationId", "baseTime"],
    });
    weatherYesterdayHourlyStore.createIndex("byExpiresAt", "expiresAt");
    weatherYesterdayHourlyStore.createIndex("byLocationId", "locationId");
  }

  // v6 was a destructive re-create of weather_daily to align key schema.
  // Keep it here so users coming from older builds are repaired.
  if (oldVersion >= 4 && oldVersion < 6) {
    if (db.objectStoreNames.contains("weather_daily")) {
      db.deleteObjectStore("weather_daily");
    }

    const weatherDailyStore = db.createObjectStore("weather_daily", { keyPath: ["locationId", "type", "baseTime"] });
    weatherDailyStore.createIndex("byExpiresAt", "expiresAt");
    weatherDailyStore.createIndex("byLocationId", "locationId");
    weatherDailyStore.createIndex("byType", "type");
  }

  // v7: add composite indexes for taskEvents queries
  if (oldVersion < 7) {
    // For v1 fresh installs, indexes already exist.
    // For upgrades, create missing indexes in-place (non-destructive).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventsStore: any = transaction.objectStore("taskEvents");
    if (!eventsStore.indexNames.contains("byTypeAndDoneAt")) {
      eventsStore.createIndex("byTypeAndDoneAt", ["type", "doneAt"]);
    }
    if (!eventsStore.indexNames.contains("byPlantIdTypeAndDoneAt")) {
      eventsStore.createIndex("byPlantIdTypeAndDoneAt", ["plantId", "type", "doneAt"]);
    }
  }
}
