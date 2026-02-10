import { useMemo } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type {
  AirQuality,
  WeatherDailyPoint,
  WeatherHourlyPoint,
  WeatherNow,
} from "@/domain/types";
import { weatherRepository } from "@/lib/weather/WeatherRepository";
import { WEATHER_QK } from "@/lib/weather/queryKeys";
import { isHttpError } from "@/lib/weather/utils/http";

export function useWeatherQueries(locationId: string): {
  nowQuery: UseQueryResult<WeatherNow | null, unknown>;
  hourlyQuery: UseQueryResult<WeatherHourlyPoint[] | null, unknown>;
  dailyQuery: UseQueryResult<WeatherDailyPoint[] | null, unknown>;
  airQualityQuery: UseQueryResult<AirQuality | null, unknown>;
  isLoading: boolean;
  error: Error | null;
} {
  const commonQueryOptions = useMemo(
    () => ({
      enabled: !!locationId,
      // Allow running queryFn offline so repository can return cached data.
      networkMode: "always" as const,
      retry: (failureCount: number, error: unknown) => {
        if (!navigator.onLine) return false;

        // Avoid retrying on most client errors.
        // Exception: 408/429 can be transient.
        if (isHttpError(error)) {
          if (error.status >= 400 && error.status < 500 && error.status !== 408 && error.status !== 429) {
            return false;
          }
        }

        return failureCount < 2;
      },
    }),
    [locationId]
  );

  const nowQuery = useQuery({
    queryKey: WEATHER_QK.now(locationId),
    queryFn: () => weatherRepository.getNow(locationId),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
    ...commonQueryOptions,
  });

  const hourlyQuery = useQuery({
    queryKey: WEATHER_QK.hourly(locationId),
    queryFn: () => weatherRepository.getHourly(locationId),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 6,
    ...commonQueryOptions,
  });

  const dailyQuery = useQuery({
    queryKey: WEATHER_QK.daily(locationId),
    queryFn: () => weatherRepository.getDaily(locationId),
    staleTime: 1000 * 60 * 60 * 6,
    gcTime: 1000 * 60 * 60 * 24,
    ...commonQueryOptions,
  });

  const airQualityQuery = useQuery({
    queryKey: WEATHER_QK.airQuality(locationId),
    queryFn: () => weatherRepository.getAirQuality(locationId),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 6,
    ...commonQueryOptions,
  });

  const isLoading =
    nowQuery.isLoading || hourlyQuery.isLoading || dailyQuery.isLoading || airQualityQuery.isLoading;

  const error = (nowQuery.error || hourlyQuery.error || dailyQuery.error || airQualityQuery.error) as
    | Error
    | null;

  return {
    nowQuery,
    hourlyQuery,
    dailyQuery,
    airQualityQuery,
    isLoading,
    error,
  };
}
