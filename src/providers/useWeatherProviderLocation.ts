import { useCallback, useEffect, useRef, useState } from "react";
import type { QueryClient } from "@tanstack/react-query";
import type { WeatherLocation } from "@/domain/types";
import { weatherRepository } from "@/lib/weather/repository/fromEnv";
import { WEATHER_QK } from "@/lib/weather/queryKeys";
import { getDefaultLocation } from "@/lib/weather/utils/defaultLocation";

type LocationPermissionState = "granted" | "denied" | "prompt" | null;

function isGeolocationPermissionNameSupported(): boolean {
  return !!navigator.permissions;
}

export function useWeatherProviderLocation(queryClient: QueryClient): {
  currentLocation: WeatherLocation | null;
  locationPermission: LocationPermissionState;
  requestLocationPermission: () => Promise<void>;
  setLocation: (lat: number, lon: number) => Promise<void>;
} {
  const [currentLocation, setCurrentLocation] = useState<WeatherLocation | null>(() => getDefaultLocation());
  const [locationPermission, setLocationPermission] = useState<LocationPermissionState>(null);

  const permissionStatusRef = useRef<PermissionStatus | null>(null);
  const permissionListenerRef = useRef<(() => void) | null>(null);

  const cleanupPermissionListener = useCallback(() => {
    const status = permissionStatusRef.current;
    const listener = permissionListenerRef.current;
    if (!status || !listener) return;

    if (typeof status.removeEventListener === "function") {
      status.removeEventListener("change", listener);
    }

    permissionStatusRef.current = null;
    permissionListenerRef.current = null;
  }, []);

  const checkLocationPermission = useCallback(async (): Promise<LocationPermissionState> => {
    if (!isGeolocationPermissionNameSupported()) return null;
    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      cleanupPermissionListener();

      const state = result.state as Exclude<LocationPermissionState, null>;
      setLocationPermission(state);

      const onChange = () => setLocationPermission(result.state as Exclude<LocationPermissionState, null>);
      permissionStatusRef.current = result;
      permissionListenerRef.current = onChange;

      if (typeof result.addEventListener === "function") {
        result.addEventListener("change", onChange);
      }

      return state;
    } catch (error) {
      console.warn("Failed to check location permission:", error);
      return null;
    }
  }, [cleanupPermissionListener]);

  useEffect(() => {
    return () => cleanupPermissionListener();
  }, [cleanupPermissionListener]);

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
    };

    void initializeLocation();
  }, [checkLocationPermission, getCurrentPosition, updateLocation]);

  const requestLocationPermission = useCallback(async () => {
    const position = await getCurrentPosition();
    await updateLocation(position.coords.latitude, position.coords.longitude);
  }, [getCurrentPosition, updateLocation]);

  const setLocation = useCallback(
    async (lat: number, lon: number) => {
      await updateLocation(lat, lon);
    },
    [updateLocation]
  );

  return {
    currentLocation,
    locationPermission,
    requestLocationPermission,
    setLocation,
  };
}
