/**
 * 위치 탐색 훅
 * GPS 위치 탐색 + 에러 처리 + 로딩 상태 관리
 */

import { useState, useEffect, useCallback } from "react";
import { useGeolocationError } from "./useGeolocationError";
import { useWeatherLocation } from "./useWeather";

export interface UseLocationSearchOptions {
  /**
   * 에러 메시지 자동 제거 여부
   * @default true
   */
  autoClearError?: boolean;

  /**
   * 에러 메시지 자동 제거 시간 (ms)
   * @default 5000
   */
  errorClearDelay?: number;

  /**
   * 위치 탐색 성공 시 콜백
   */
  onSuccess?: (lat: number, lon: number) => void;

  /**
   * 위치 탐색 실패 시 콜백
   */
  onError?: (errorMessage: string) => void;

  /**
   * 날씨 위치도 업데이트할지 여부
   * true일 경우 useWeatherLocation의 requestPermission 사용
   * false일 경우 순수 Geolocation API만 사용
   * @default true
   */
  updateWeatherLocation?: boolean;
}

export interface UseLocationSearchReturn {
  /**
   * 현재 위치 탐색 실행
   */
  searchLocation: () => Promise<void>;

  /**
   * 로딩 상태
   */
  isLoading: boolean;

  /**
   * 에러 메시지 (null이면 에러 없음)
   */
  error: string | null;

  /**
   * 에러 메시지 수동 제거
   */
  clearError: () => void;
}

/**
 * 위치 탐색 훅
 * GPS 위치 탐색 기능을 제공하며, 에러 처리와 로딩 상태를 관리합니다.
 */
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

  // 에러 메시지 자동 제거
  useEffect(() => {
    if (autoClearError && error) {
      const timer = setTimeout(() => {
        setError(null);
      }, errorClearDelay);
      return () => clearTimeout(timer);
    }
  }, [error, autoClearError, errorClearDelay]);

  /**
   * 순수 Geolocation API를 사용한 위치 탐색
   */
  const getCurrentPosition = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5분
      });
    });
  }, []);

  /**
   * 위치 탐색 실행
   */
  const searchLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (updateWeatherLocation) {
        // 날씨 위치 업데이트 포함
        await requestPermission();

        // requestPermission이 성공하면 날씨 위치가 업데이트됨
        // 성공 콜백을 위해 현재 위치를 가져옴
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;

        onSuccess?.(latitude, longitude);
      } else {
        // 순수 Geolocation만 사용
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;

        onSuccess?.(latitude, longitude);
      }

      // 성공 시 에러 메시지 초기화
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

  /**
   * 에러 메시지 수동 제거
   */
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
