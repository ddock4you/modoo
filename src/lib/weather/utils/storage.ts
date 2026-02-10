const WEATHER_STORAGE_VERSION = "v1";
const WEATHER_STORAGE_PREFIX = `weather:${WEATHER_STORAGE_VERSION}`;

export const WEATHER_STORAGE_KEYS = {
  lastDateCheckYmd: `${WEATHER_STORAGE_PREFIX}:lastDateCheckYmd`,
} as const;

export function safeGetLocalStorageItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetLocalStorageItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore (private mode / quota / disabled)
  }
}
