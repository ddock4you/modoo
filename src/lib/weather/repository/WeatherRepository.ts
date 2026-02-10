/**
 * Weather Repository
 * IndexedDB cache + external API providers orchestration.
 */

import type {
  AirQuality,
  WeatherDailyPoint,
  WeatherHourlyPoint,
  WeatherLocation,
  WeatherNow,
} from "@/domain/types";
import { weatherCache } from "@/lib/weather/IndexedDbWeatherCache";
import { AirKoreaProvider } from "@/lib/weather/clients/AirKoreaProvider";
import { KmaWeatherProvider } from "@/lib/weather/clients/kma/KmaWeatherProvider";
import { VWorldGeocodingProvider } from "@/lib/weather/clients/VWorldGeocodingProvider";
import { latLonToGrid } from "@/lib/weather/utils/kmaGrid";
import { latLonToTM } from "@/lib/weather/utils/coord";
import {
  getYesterdayKstYmd,
  kstYmdToMidnightBaseTime,
  normalizeBaseTime,
} from "@/lib/weather/utils/baseTime";
import { DEFAULT_LOCATION_ID, getDefaultLocation } from "@/lib/weather/utils/defaultLocation";

export interface WeatherRepositoryConfig {
  kmaApiKey: string;
  airKoreaApiKey: string;
  vworldApiKey: string;
}

export interface IWeatherRepository {
  init(): Promise<void>;
  getNow(locationId: string): Promise<WeatherNow | null>;
  getHourly(locationId: string): Promise<WeatherHourlyPoint[] | null>;
  getDaily(locationId: string): Promise<WeatherDailyPoint[] | null>;
  getAirQuality(locationId: string): Promise<AirQuality | null>;
  getYesterdayHourly(locationId: string, date?: string): Promise<WeatherHourlyPoint[] | null>;
  getOrCreateLocation(lat: number, lon: number): Promise<WeatherLocation>;
  hasCachedData(locationId: string): Promise<boolean>;
  cleanup(): Promise<void>;
}

export class WeatherRepository implements IWeatherRepository {
  private readonly kmaProvider: KmaWeatherProvider;
  private readonly airKoreaProvider: AirKoreaProvider;
  private readonly vworldProvider: VWorldGeocodingProvider;
  private initialized = false;

  constructor(config: WeatherRepositoryConfig) {
    this.kmaProvider = new KmaWeatherProvider(config.kmaApiKey);
    this.airKoreaProvider = new AirKoreaProvider(config.airKoreaApiKey);
    this.vworldProvider = new VWorldGeocodingProvider(config.vworldApiKey);
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    await weatherCache.init();
    this.initialized = true;
  }

  private generateLocationId(lat: number, lon: number): string {
    const { nx, ny } = latLonToGrid(lat, lon);
    return `grid_${nx}_${ny}`;
  }

  // Kept for test/backward compatibility.
  // (Some tests access this via `(repo as any).normalizeBaseTime`.)
  private normalizeBaseTime(baseTime: number, type: "now" | "hourly" | "daily" | "airQuality"): number {
    return normalizeBaseTime(baseTime, type);
  }

  private async getLocationOrDefault(locationId: string): Promise<WeatherLocation | null> {
    const fromCache = await weatherCache.getLocation(locationId);
    if (fromCache) return fromCache;

    if (locationId !== DEFAULT_LOCATION_ID) return null;

    const loc = getDefaultLocation();
    await weatherCache.setLocation(loc);
    return loc;
  }

  async getNow(locationId: string): Promise<WeatherNow | null> {
    await this.init();

    const baseTime = this.normalizeBaseTime(Date.now(), "now");
    const exact = await weatherCache.getNow(locationId, baseTime);
    if (exact && !exact.isStale) return exact.data;

    const latest = exact ?? (await weatherCache.getLatestNow(locationId));

    if (!navigator.onLine) {
      return latest?.data ?? null;
    }

    try {
      const location = await this.getLocationOrDefault(locationId);
      if (!location) return latest?.data ?? null;

      const now = await this.kmaProvider.getCurrentWeather(location);
      await weatherCache.setNow(locationId, baseTime, now);
      return now;
    } catch {
      return latest?.data ?? null;
    }
  }

  async getHourly(locationId: string): Promise<WeatherHourlyPoint[] | null> {
    await this.init();

    const baseTime = this.normalizeBaseTime(Date.now(), "hourly");
    const exact = await weatherCache.getHourly(locationId, baseTime);
    if (exact && !exact.isStale) return exact.data;

    const latest = exact ?? (await weatherCache.getLatestHourly(locationId));

    if (!navigator.onLine) {
      return latest?.data ?? null;
    }

    try {
      const location = await this.getLocationOrDefault(locationId);
      if (!location) return latest?.data ?? null;

      const hourly = await this.kmaProvider.getHourlyForecast24h(location);
      await weatherCache.setHourly(locationId, baseTime, hourly);
      return hourly;
    } catch {
      return latest?.data ?? null;
    }
  }

  async getDaily(locationId: string): Promise<WeatherDailyPoint[] | null> {
    await this.init();

    const baseTime = this.normalizeBaseTime(Date.now(), "daily");
    const [shortExact, midExact] = await Promise.all([
      weatherCache.getDaily(locationId, baseTime, "short"),
      weatherCache.getDaily(locationId, baseTime, "mid"),
    ]);

    const shortLatest = shortExact ?? (await weatherCache.getLatestDaily(locationId, "short"));
    const midLatest = midExact ?? (await weatherCache.getLatestDaily(locationId, "mid"));

    const combine = (shortData?: WeatherDailyPoint[], midData?: WeatherDailyPoint[]) => {
      const combined = [...(shortData ?? []), ...(midData ?? [])];
      if (combined.length === 0) return null;
      return combined
        .slice()
        .sort(
          (a: WeatherDailyPoint, b: WeatherDailyPoint) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );
    };

    const hasFreshBoth =
      shortExact && !shortExact.isStale && midExact && !midExact.isStale;

    if (hasFreshBoth) {
      return combine(shortExact.data, midExact.data);
    }

    if (!navigator.onLine) {
      return combine(shortLatest?.data, midLatest?.data);
    }

    try {
      const location = await this.getLocationOrDefault(locationId);
      if (!location) {
        return combine(shortLatest?.data, midLatest?.data);
      }

      const daily = await this.kmaProvider.getDailyForecast7d(location);

      // Split short/mid ranges for caching.
      const now = new Date();
      const kstOffsetMinutes = 9 * 60 + now.getTimezoneOffset();
      const kstNow = new Date(now.getTime() + kstOffsetMinutes * 60 * 1000);
      const today = new Date(kstNow.getFullYear(), kstNow.getMonth(), kstNow.getDate());
      today.setHours(0, 0, 0, 0);

      const shortTermData: WeatherDailyPoint[] = [];
      const midTermData: WeatherDailyPoint[] = [];
      for (const day of daily) {
        const dayDate = new Date(day.date);
        dayDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((dayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff >= 0 && daysDiff <= 3) shortTermData.push(day);
        else if (daysDiff >= 4 && daysDiff <= 10) midTermData.push(day);
      }

      if (shortTermData.length > 0) await weatherCache.setDaily(locationId, baseTime, shortTermData, "short");
      if (midTermData.length > 0) await weatherCache.setDaily(locationId, baseTime, midTermData, "mid");

      return daily;
    } catch {
      return combine(shortLatest?.data, midLatest?.data);
    }
  }

  async getAirQuality(locationId: string): Promise<AirQuality | null> {
    await this.init();

    const baseTime = this.normalizeBaseTime(Date.now(), "airQuality");
    const exact = await weatherCache.getAirQuality(locationId, baseTime);
    if (exact && !exact.isStale) return exact.data;

    const latest = exact ?? (await weatherCache.getLatestAirQuality(locationId));

    if (!navigator.onLine) {
      return latest?.data ?? null;
    }

    try {
      const location = await this.getLocationOrDefault(locationId);
      if (!location) return latest?.data ?? null;

      const airQuality = await this.getAirQualityForLocation(location);
      await weatherCache.setAirQuality(locationId, baseTime, airQuality);
      return airQuality;
    } catch {
      return latest?.data ?? null;
    }
  }

  private async getAirQualityForLocation(location: WeatherLocation): Promise<AirQuality> {
    try {
      const stations = await this.airKoreaProvider.getNearbyStations(location.tmX, location.tmY);
      if (stations.length === 0) {
        throw new Error("No nearby air quality stations found");
      }

      let nearest = stations[0];
      for (let i = 1; i < stations.length; i++) {
        if (stations[i].distance < nearest.distance) nearest = stations[i];
      }

      return await this.airKoreaProvider.getAirQuality(nearest.name);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("Failed to get air quality by location:", error);
      }

      try {
        const fallbackStation = this.getFallbackStation(location.lat, location.lon);
        return await this.airKoreaProvider.getAirQuality(fallbackStation);
      } catch {
        return await this.airKoreaProvider.getAirQuality("종로구");
      }
    }
  }

  private getFallbackStation(lat: number, lon: number): string {
    // Keep minimal heuristics. If unknown, fall back to Seoul.
    if (lat >= 37.4 && lat <= 37.7 && lon >= 126.7 && lon <= 127.2) {
      return "종로구";
    }
    if (lat >= 35.0 && lat <= 35.3 && lon >= 128.9 && lon <= 129.3) {
      return "부산 북구";
    }
    return "종로구";
  }

  async getYesterdayHourly(locationId: string, date?: string): Promise<WeatherHourlyPoint[] | null> {
    await this.init();

    const yesterdayYmd = date || getYesterdayKstYmd();
    const yesterdayBaseTime = kstYmdToMidnightBaseTime(yesterdayYmd);
    const exact = await weatherCache.getYesterdayHourly(locationId, yesterdayBaseTime);
    if (exact && !exact.isStale) return exact.data;

    const latest = exact ?? (await weatherCache.getLatestYesterdayHourly(locationId));

    if (!navigator.onLine) {
      return latest?.data ?? null;
    }

    try {
      const location = await this.getLocationOrDefault(locationId);
      if (!location) return latest?.data ?? null;

      const yesterdayHourly = await this.kmaProvider.getHourlyForecast24h(location, yesterdayYmd);
      await weatherCache.setYesterdayHourly(locationId, yesterdayBaseTime, yesterdayHourly);
      return yesterdayHourly;
    } catch {
      return latest?.data ?? null;
    }
  }

  async getOrCreateLocation(lat: number, lon: number): Promise<WeatherLocation> {
    await this.init();

    const locationId = this.generateLocationId(lat, lon);
    const cached = await weatherCache.getLocation(locationId);
    if (cached) {
      if (cached.nx === undefined || cached.ny === undefined || cached.tmX === undefined || cached.tmY === undefined) {
        const { nx, ny } = latLonToGrid(cached.lat, cached.lon);
        const { tmX, tmY } = latLonToTM(cached.lat, cached.lon);
        const updated = { ...cached, nx, ny, tmX, tmY, timezone: cached.timezone || "Asia/Seoul" };
        await weatherCache.setLocation(updated);
        return updated;
      }
      return cached;
    }

    const cachedGeocode = await weatherCache.getGeocodingAddress(lat, lon);

    try {
      // If cache is fresh, don't call VWorld.
      const address = cachedGeocode && !cachedGeocode.isStale
        ? cachedGeocode.data
        : await this.vworldProvider.reverseGeocode(lat, lon);

      if (!cachedGeocode || cachedGeocode.isStale) {
        await weatherCache.setGeocodingAddress(lat, lon, address);
      }

      const { nx, ny } = latLonToGrid(lat, lon);
      const { tmX, tmY } = latLonToTM(lat, lon);

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
        updatedAt: Date.now(),
      };

      await weatherCache.setLocation(location);
      return location;
    } catch {
      const { nx, ny } = latLonToGrid(lat, lon);
      const { tmX, tmY } = latLonToTM(lat, lon);

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
        updatedAt: Date.now(),
      };

      await weatherCache.setLocation(location);
      return location;
    }
  }

  async hasCachedData(locationId: string): Promise<boolean> {
    await this.init();

    const [now, hourly, dailyShort, dailyMid, airQuality] = await Promise.all([
      weatherCache.getLatestNow(locationId),
      weatherCache.getLatestHourly(locationId),
      weatherCache.getLatestDaily(locationId, "short"),
      weatherCache.getLatestDaily(locationId, "mid"),
      weatherCache.getLatestAirQuality(locationId),
    ]);

    return !!(now || hourly || dailyShort || dailyMid || airQuality);
  }

  async cleanup(): Promise<void> {
    await this.init();
    await weatherCache.cleanupExpiredCache();
    await weatherCache.cleanupExpiredGeocodingCache();
  }
}

function getWeatherConfig(): WeatherRepositoryConfig {
  return {
    kmaApiKey: import.meta.env.VITE_KMA_SERVICE_KEY || "",
    airKoreaApiKey: import.meta.env.VITE_AIRKOREA_SERVICE_KEY || "",
    vworldApiKey: import.meta.env.VITE_VWORLD_API_KEY || "",
  };
}

export const weatherRepository = new WeatherRepository(getWeatherConfig());
