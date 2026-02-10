import type { WeatherLocation } from "@/domain/types";
import type { WeatherCacheExact, WeatherCacheLatest } from "./types";

export async function swrWithLocation<T>(params: {
  exact: () => Promise<WeatherCacheExact<T>>;
  latest: () => Promise<WeatherCacheLatest<T>>;
  isOnline: () => boolean;
  getLocation: () => Promise<WeatherLocation | null>;
  fetch: (location: WeatherLocation) => Promise<T>;
  set: (data: T) => Promise<void>;
}): Promise<T | null> {
  const exact = await params.exact();
  if (exact && !exact.isStale) return exact.data;

  const latest = exact ?? (await params.latest());
  const latestData = latest?.data ?? null;

  if (!params.isOnline()) return latestData;

  try {
    const location = await params.getLocation();
    if (!location) return latestData;

    const data = await params.fetch(location);
    await params.set(data);
    return data;
  } catch {
    return latestData;
  }
}
