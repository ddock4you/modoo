import type { DBSchema } from "idb";
import type {
  AirQuality,
  PhotoMeta,
  Plant,
  SettingKV,
  TaskEvent,
  TaskRule,
  WeatherDailyPoint,
  WeatherHourlyPoint,
  WeatherLocation,
  WeatherNow,
} from "@/domain/types";

export interface WeatherGeocodingCacheEntry {
  key: string; // "lat,lon"
  lat: number;
  lon: number;
  address: string;
  createdAt: number;
  expiresAt: number;
}

export interface WeatherCacheEntry<TData> {
  locationId: string;
  baseTime: number;
  data: TData;
  expiresAt: number;
}

export interface PhotosBlobEntry {
  id: string;
  plantId: string;
  originalBlob: Blob;
  thumbnailBlob: Blob;
  metadata: PhotoMeta;
  createdAt: number;
}

export interface ModooDB extends DBSchema {
  plants: {
    key: string;
    value: Plant;
    indexes: {
      byName: string;
      byAdoptedAt: number;
    };
  };

  taskRules: {
    key: string;
    value: TaskRule;
    indexes: {
      byPlantId: string;
      byType: "water";
      byNextDueAt: number;
      byActiveAndNextDueAt: [0 | 1, number];
      byPlantIdTypeActive: [string, "water", 0 | 1];
    };
  };

  taskEvents: {
    key: string;
    value: TaskEvent;
    indexes: {
      byPlantId: string;
      byType: "water";
      byDoneAt: number;
      byPlantIdAndDoneAt: [string, number];
      byTypeAndDoneAt: ["water", number];
      byPlantIdTypeAndDoneAt: [string, "water", number];
    };
  };

  photos: {
    key: string;
    value: PhotoMeta;
    indexes: {
      byPlantId: string;
      byCreatedAt: number;
    };
  };

  photos_blobs: {
    key: string;
    value: PhotosBlobEntry;
    indexes: {
      byPlantId: string;
      byCreatedAt: number;
    };
  };

  settings: {
    key: string;
    value: SettingKV;
  };

  weather_geocoding_cache: {
    key: string;
    value: WeatherGeocodingCacheEntry;
    indexes: {
      byExpiresAt: number;
    };
  };

  weather_now: {
    key: [string, number];
    value: WeatherCacheEntry<WeatherNow>;
    indexes: {
      byExpiresAt: number;
      byLocationId: string;
    };
  };

  weather_hourly: {
    key: [string, number];
    value: WeatherCacheEntry<WeatherHourlyPoint[]>;
    indexes: {
      byExpiresAt: number;
      byLocationId: string;
    };
  };

  weather_daily: {
    key: [string, string, number];
    value: WeatherCacheEntry<WeatherDailyPoint[]> & { type: "short" | "mid" };
    indexes: {
      byExpiresAt: number;
      byLocationId: string;
      byType: string;
    };
  };

  air_quality: {
    key: [string, number];
    value: WeatherCacheEntry<AirQuality>;
    indexes: {
      byExpiresAt: number;
      byLocationId: string;
    };
  };

  weather_locations: {
    key: string;
    value: WeatherLocation & { updatedAt: number };
    indexes: {
      byUpdatedAt: number;
    };
  };

  weather_yesterday_hourly: {
    key: [string, number];
    value: WeatherCacheEntry<WeatherHourlyPoint[]>;
    indexes: {
      byExpiresAt: number;
      byLocationId: string;
    };
  };
}
