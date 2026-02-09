export const WEATHER_QK = {
  all: () => ["weather"] as const,

  now: (locationId: string) => ["weather", "now", locationId] as const,
  hourly: (locationId: string) => ["weather", "hourly", locationId] as const,
  daily: (locationId: string) => ["weather", "daily", locationId] as const,
  airQuality: (locationId: string) => ["weather", "airQuality", locationId] as const,

  yesterdayAll: () => ["weather", "yesterday"] as const,
  yesterday: (locationId: string) => ["weather", "yesterday", locationId] as const,
} as const;
