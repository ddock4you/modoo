import type { AirQuality, WeatherDailyPoint, WeatherHourlyPoint, WeatherNow } from "@/domain/weather/types";

export interface WeatherNowCacheEntry {
  locationId: string;
  baseTime: number;
  data: WeatherNow;
  expiresAt: number;
}

export interface WeatherHourlyCacheEntry {
  locationId: string;
  baseTime: number;
  data: WeatherHourlyPoint[];
  expiresAt: number;
}

export interface WeatherDailyCacheEntry {
  locationId: string;
  baseTime: number;
  data: WeatherDailyPoint[];
  expiresAt: number;
}

export interface AirQualityCacheEntry {
  locationId: string;
  baseTime: number;
  data: AirQuality;
  expiresAt: number;
}
