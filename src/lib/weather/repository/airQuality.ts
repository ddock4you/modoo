import type { AirQuality, WeatherLocation } from "@/domain/types";
import type { AirKoreaProviderLike, WeatherLogger } from "./types";

export type AirQualityDeps = {
  provider: AirKoreaProviderLike;
  isDev: boolean;
  logger: WeatherLogger;
};

export async function getAirQualityForLocation(location: WeatherLocation, deps: AirQualityDeps): Promise<AirQuality> {
  const { provider, isDev, logger } = deps;
  try {
    const stations = await provider.getNearbyStations(location.tmX, location.tmY);
    if (stations.length === 0) {
      throw new Error("No nearby air quality stations found");
    }

    let nearest = stations[0];
    for (let i = 1; i < stations.length; i++) {
      if (stations[i].distance < nearest.distance) nearest = stations[i];
    }

    return await provider.getAirQuality(nearest.name);
  } catch (error) {
    if (isDev) {
      logger.warn("Failed to get air quality by location:", error);
    }

    try {
      const fallbackStation = getFallbackStation(location.lat, location.lon);
      return await provider.getAirQuality(fallbackStation);
    } catch {
      return await provider.getAirQuality("종로구");
    }
  }
}

function getFallbackStation(lat: number, lon: number): string {
  // Keep minimal heuristics. If unknown, fall back to Seoul.
  if (lat >= 37.4 && lat <= 37.7 && lon >= 126.7 && lon <= 127.2) {
    return "종로구";
  }
  if (lat >= 35.0 && lat <= 35.3 && lon >= 128.9 && lon <= 129.3) {
    return "부산 북구";
  }
  return "종로구";
}
