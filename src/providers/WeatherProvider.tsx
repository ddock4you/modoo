/**
 * Weather Provider Context
 * GPS location + TanStack Query integration.
 */

import { useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { weatherRepository } from "@/lib/weather/repository/fromEnv";
import { WEATHER_QK } from "@/lib/weather/queryKeys";
import { WeatherContext, type WeatherContextValue, type WeatherProviderProps, useWeatherContext } from "./WeatherContext";
import { useKstDateRolloverInvalidation } from "./useKstDateRolloverInvalidation";
import { useOnlineStatus } from "./useOnlineStatus";
import { useWeatherProviderLocation } from "./useWeatherProviderLocation";
import { useWeatherQueries } from "./useWeatherQueries";

export function WeatherProvider({ children }: WeatherProviderProps) {
  const queryClient = useQueryClient();

  const isOnline = useOnlineStatus();
  useKstDateRolloverInvalidation(queryClient);

  useEffect(() => {
    weatherRepository.init().catch(console.error);
  }, []);

  const { currentLocation, locationPermission, requestLocationPermission, setLocation } =
    useWeatherProviderLocation(queryClient);

  const locationId = currentLocation?.id || "default";
  const { nowQuery, hourlyQuery, dailyQuery, airQualityQuery, isLoading, error } = useWeatherQueries(locationId);

  const refreshWeather = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: WEATHER_QK.all() });
  }, [queryClient]);

  const contextValue: WeatherContextValue = {
    currentLocation,
    locationPermission,
    isOnline,
    nowQuery,
    hourlyQuery,
    dailyQuery,
    airQualityQuery,
    refreshWeather,
    requestLocationPermission,
    setLocation,
    isLoading,
    error,
  };

  return <WeatherContext.Provider value={contextValue}>{children}</WeatherContext.Provider>;
}

export { useWeatherContext };
export type { WeatherProviderProps, WeatherContextValue };
