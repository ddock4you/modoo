import { useState, useEffect, useCallback } from "react";
import { useGeolocationError } from "./useGeolocationError";
import { useWeatherLocation } from "./useWeather";

export interface UseLocationSearchOptions {
  autoClearError?: boolean;
  errorClearDelay?: number;
  onSuccess?: (lat: number, lon: number) => void;
  onError?: (errorMessage: string) => void;
  updateWeatherLocation?: boolean;
}

export interface UseLocationSearchReturn {
  searchLocation: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useLocationSearch(options: UseLocationSearchOptions = {}): UseLocationSearchReturn {
  const {
    autoClearError = true,
    errorClearDelay = 5000,
    onSuccess,
    onError,
    updateWeatherLocation = true,
  } = options;

  const { getErrorMessage } = useGeolocationError();
  const { requestPermission } = useWeatherLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoClearError && error) {
      const timer = setTimeout(() => {
        setError(null);
      }, errorClearDelay);
      return () => clearTimeout(timer);
    }
  }, [error, autoClearError, errorClearDelay]);

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

  const searchLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (updateWeatherLocation) {
        await requestPermission();
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;

        onSuccess?.(latitude, longitude);
      } else {
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;

        onSuccess?.(latitude, longitude);
      }

      setError(null);
    } catch (err) {
      console.error("Failed to get current location:", err);

      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [
    updateWeatherLocation,
    requestPermission,
    getCurrentPosition,
    getErrorMessage,
    onSuccess,
    onError,
  ]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    searchLocation,
    isLoading,
    error,
    clearError,
  };
}
