import { WeatherRepository } from "./WeatherRepository";
import type { WeatherRepositoryConfig } from "./types";

export function getWeatherRepositoryConfigFromEnv(): WeatherRepositoryConfig {
  return {
    kmaApiKey: import.meta.env.VITE_KMA_SERVICE_KEY || "",
    airKoreaApiKey: import.meta.env.VITE_AIRKOREA_SERVICE_KEY || "",
    vworldApiKey: import.meta.env.VITE_VWORLD_API_KEY || "",
  };
}

export function createWeatherRepositoryFromEnv(): WeatherRepository {
  return new WeatherRepository(getWeatherRepositoryConfigFromEnv());
}

export const weatherRepository = createWeatherRepositoryFromEnv();
