import type { WeatherLocation } from "@/domain/types";
import { DEFAULT_LOCATION_ID, getDefaultLocation } from "@/lib/weather/utils/defaultLocation";
import { latLonToTM } from "@/lib/weather/utils/coord";
import { latLonToGrid } from "@/lib/weather/utils/kmaGrid";
import { generateLocationId } from "./locationId";
import type { VWorldProviderLike, WeatherCache } from "./types";

export type WeatherCacheLocationLike = Pick<
  WeatherCache,
  "getLocation" | "setLocation" | "getGeocodingAddress" | "setGeocodingAddress"
>;

export async function getLocationOrDefault(
  cache: WeatherCacheLocationLike,
  locationId: string
): Promise<WeatherLocation | null> {
  const fromCache = await cache.getLocation(locationId);
  if (fromCache) return fromCache;

  if (locationId !== DEFAULT_LOCATION_ID) return null;

  const loc = getDefaultLocation();
  await cache.setLocation(loc);
  return loc;
}

export async function getOrCreateLocation(
  cache: WeatherCacheLocationLike,
  vworldProvider: VWorldProviderLike,
  nowMs: number,
  lat: number,
  lon: number
): Promise<WeatherLocation> {
  const locationId = generateLocationId(lat, lon);

  const cached = await cache.getLocation(locationId);
  if (cached) {
    if (
      cached.nx === undefined ||
      cached.ny === undefined ||
      cached.tmX === undefined ||
      cached.tmY === undefined
    ) {
      const { nx, ny } = latLonToGrid(cached.lat, cached.lon);
      const { tmX, tmY } = latLonToTM(cached.lat, cached.lon);
      const updated: WeatherLocation = {
        ...cached,
        nx,
        ny,
        tmX,
        tmY,
        timezone: cached.timezone || "Asia/Seoul",
      };
      await cache.setLocation(updated);
      return updated;
    }
    return cached;
  }

  const cachedGeocode = await cache.getGeocodingAddress(lat, lon);

  const { nx, ny } = latLonToGrid(lat, lon);
  const { tmX, tmY } = latLonToTM(lat, lon);

  try {
    const address =
      cachedGeocode && !cachedGeocode.isStale
        ? cachedGeocode.data
        : await vworldProvider.reverseGeocode(lat, lon);

    if (!cachedGeocode || cachedGeocode.isStale) {
      await cache.setGeocodingAddress(lat, lon, address);
    }

    const location: WeatherLocation = {
      id: locationId,
      lat,
      lon,
      nx,
      ny,
      tmX,
      tmY,
      timezone: "Asia/Seoul",
      name: address || `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      updatedAt: nowMs,
    };

    await cache.setLocation(location);
    return location;
  } catch {
    const fallbackName = cachedGeocode?.data || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    const location: WeatherLocation = {
      id: locationId,
      lat,
      lon,
      nx,
      ny,
      tmX,
      tmY,
      timezone: "Asia/Seoul",
      name: fallbackName,
      updatedAt: nowMs,
    };
    await cache.setLocation(location);
    return location;
  }
}
