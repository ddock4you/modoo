export interface WeatherCacheResult<T = unknown> {
  data: T;
  isStale: boolean;
  expiresAt: number;
  // Optional: consumers may use this when selecting a fallback.
  baseTime?: number;
}

export type WeatherCacheStoreName =
  | "weather_now"
  | "weather_hourly"
  | "weather_daily"
  | "air_quality"
  | "weather_yesterday_hourly";
