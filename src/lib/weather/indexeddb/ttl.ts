export const WEATHER_CACHE_TTL_MINUTES = {
  now: 10,
  hourly: 60,
  shortTermDaily: 6 * 60,
  midTermDaily: 12 * 60,
  airQuality: 60,
  yesterdayHourly: 24 * 60,
  // VWorld reverse geocoding labels change infrequently.
  geocoding: 30 * 24 * 60,
} as const;

export type WeatherCacheTtlKind = keyof typeof WEATHER_CACHE_TTL_MINUTES;

export function getExpiresAt(kind: WeatherCacheTtlKind, nowMs: number = Date.now()): number {
  return nowMs + WEATHER_CACHE_TTL_MINUTES[kind] * 60 * 1000;
}
