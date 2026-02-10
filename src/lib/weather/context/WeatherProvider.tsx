/**
 * Weather Provider Context
 * GPS location + TanStack Query integration.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import type {
  AirQuality,
  WeatherDailyPoint,
  WeatherHourlyPoint,
  WeatherLocation,
  WeatherNow,
} from "@/domain/types";
import { weatherRepository } from "@/lib/weather/WeatherRepository";
import { WEATHER_QK } from "@/lib/weather/queryKeys";
import { getKstNow, getKstYmd } from "@/lib/weather/utils/baseTime";
import { getDefaultLocation } from "@/lib/weather/utils/defaultLocation";
import {
  safeGetLocalStorageItem,
  safeSetLocalStorageItem,
  WEATHER_STORAGE_KEYS,
} from "@/lib/weather/utils/storage";

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

const WeatherContext = createContext<WeatherContextValue | null>(null);

export interface WeatherProviderProps {
  children: ReactNode;
}

export function WeatherProvider({ children }: WeatherProviderProps) {
  const queryClient = useQueryClient();

  const [currentLocation, setCurrentLocation] = useState<WeatherLocation | null>(null);
  const [locationPermission, setLocationPermission] = useState<
    "granted" | "denied" | "prompt" | null
  >(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    weatherRepository.init().catch(console.error);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const checkDateChange = () => {
      const currentDate = getKstYmd(getKstNow());
      const lastCheckedDate = safeGetLocalStorageItem(WEATHER_STORAGE_KEYS.lastDateCheckYmd);

      if (lastCheckedDate !== currentDate) {
        void queryClient.invalidateQueries({ queryKey: WEATHER_QK.yesterdayAll(), exact: false });
        safeSetLocalStorageItem(WEATHER_STORAGE_KEYS.lastDateCheckYmd, currentDate);
      }
    };

    checkDateChange();
    const interval = setInterval(checkDateChange, 60 * 1000);
    return () => clearInterval(interval);
  }, [queryClient]);

  const checkLocationPermission = useCallback(async (): Promise<
    "granted" | "denied" | "prompt" | null
  > => {
    if (!navigator.permissions) return null;
    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      const state = result.state as "granted" | "denied" | "prompt";
      setLocationPermission(state);

      const onChange = () => setLocationPermission(result.state as "granted" | "denied" | "prompt");
      if (typeof result.addEventListener === "function") {
        result.addEventListener("change", onChange);
      }
      return state;
    } catch (error) {
      console.warn("Failed to check location permission:", error);
      return null;
    }
  }, []);

  const getCurrentPosition = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      });
    });
  }, []);

  const updateLocation = useCallback(
    async (lat: number, lon: number) => {
      try {
        const location = await weatherRepository.getOrCreateLocation(lat, lon);
        setCurrentLocation(location);
        void queryClient.invalidateQueries({ queryKey: WEATHER_QK.all() });
      } catch (error) {
        console.error("Failed to update location:", error);
      }
    },
    [queryClient]
  );

  useEffect(() => {
    const initializeLocation = async () => {
      const permission = await checkLocationPermission();
      if (permission === "granted") {
        try {
          const position = await getCurrentPosition();
          await updateLocation(position.coords.latitude, position.coords.longitude);
          return;
        } catch (error) {
          console.warn("Failed to get current position, using default location:", error);
        }
      }

      setCurrentLocation(getDefaultLocation());
    };

    void initializeLocation();
  }, [checkLocationPermission, getCurrentPosition, updateLocation]);

  const locationId = currentLocation?.id || "default";

  const commonQueryOptions = useMemo(
    () => ({
      enabled: !!locationId,
      // Allow running queryFn offline so repository can return cached data.
      networkMode: "always" as const,
      retry: (failureCount: number, error: unknown) => {
        if (!navigator.onLine) return false;
        if (error instanceof Error && error.message.includes("4")) return false;
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

  const refreshWeather = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: WEATHER_QK.all() });
  }, [queryClient]);

  const requestLocationPermission = useCallback(async () => {
    const position = await getCurrentPosition();
    await updateLocation(position.coords.latitude, position.coords.longitude);
  }, [getCurrentPosition, updateLocation]);

  const setLocation = useCallback(async (lat: number, lon: number) => {
    await updateLocation(lat, lon);
  }, [updateLocation]);

  const isLoading = nowQuery.isLoading || hourlyQuery.isLoading || dailyQuery.isLoading || airQualityQuery.isLoading;
  const error = (nowQuery.error || hourlyQuery.error || dailyQuery.error || airQualityQuery.error) as Error | null;

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

export function useWeatherContext(): WeatherContextValue {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error("useWeatherContext must be used within a WeatherProvider");
  }
  return context;
}
