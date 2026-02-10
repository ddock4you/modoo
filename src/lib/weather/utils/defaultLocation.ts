import type { WeatherLocation } from "@/domain/types";

// Default location (Seoul Songpa-gu Jamsil-dong)
// Keep this in one place to avoid drift between provider/repository.
export const DEFAULT_LOCATION_ID = "default" as const;

export function getDefaultLocation(nowMs: number = Date.now()): WeatherLocation {
  return {
    id: DEFAULT_LOCATION_ID,
    lat: 37.5139,
    lon: 127.1025,
    name: "서울 송파구 잠실동",
    nx: 62,
    ny: 124,
    tmX: 961114,
    tmY: 1946434,
    timezone: "Asia/Seoul",
    updatedAt: nowMs,
  };
}
