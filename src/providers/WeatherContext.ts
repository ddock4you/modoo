import { createContext, useContext, type ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type {
  AirQuality,
  WeatherDailyPoint,
  WeatherHourlyPoint,
  WeatherLocation,
  WeatherNow,
} from "@/domain/types";

export interface WeatherContextValue {
  currentLocation: WeatherLocation | null;
  locationPermission: "granted" | "denied" | "prompt" | null;
  isOnline: boolean;

  nowQuery: UseQueryResult<WeatherNow | null, unknown>;
  hourlyQuery: UseQueryResult<WeatherHourlyPoint[] | null, unknown>;
  dailyQuery: UseQueryResult<WeatherDailyPoint[] | null, unknown>;
  airQualityQuery: UseQueryResult<AirQuality | null, unknown>;

  refreshWeather: () => Promise<void>;
  requestLocationPermission: () => Promise<void>;
  setLocation: (lat: number, lon: number) => Promise<void>;

  isLoading: boolean;
  error: Error | null;
}

export interface WeatherProviderProps {
  children: ReactNode;
}

export const WeatherContext = createContext<WeatherContextValue | null>(null);

export function useWeatherContext(): WeatherContextValue {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error("useWeatherContext must be used within a WeatherProvider");
  }
  return context;
}
