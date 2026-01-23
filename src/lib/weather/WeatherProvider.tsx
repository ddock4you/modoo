/**
 * Weather Provider Context
 * 날씨 데이터 상태 관리 및 TanStack Query 통합
 */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import type {
  WeatherLocation,
  WeatherNow,
  WeatherHourlyPoint,
  WeatherDailyPoint,
  AirQuality,
} from "../../domain/types";
import { weatherRepository } from "./WeatherRepository";

// 기본 위치 (서울 송파구 잠실동)
const DEFAULT_LOCATION: WeatherLocation = {
  id: "default",
  lat: 37.5139,
  lon: 127.1025,
  name: "서울 송파구 잠실동",
  nx: 62, // KMA 격자 좌표 (추정)
  ny: 124, // KMA 격자 좌표 (추정)
  tmX: 961114, // TM 좌표 (추정)
  tmY: 1946434, // TM 좌표 (추정)
  timezone: "Asia/Seoul",
  updatedAt: Date.now(),
};

export interface WeatherContextValue {
  // 현재 위치 및 권한 상태
  currentLocation: WeatherLocation | null;
  locationPermission: "granted" | "denied" | "prompt" | null;
  isOnline: boolean;

  // 날씨 데이터 쿼리들
  nowQuery: UseQueryResult<WeatherNow | null>;
  hourlyQuery: UseQueryResult<WeatherHourlyPoint[] | null>;
  dailyQuery: UseQueryResult<WeatherDailyPoint[] | null>;
  airQualityQuery: UseQueryResult<AirQuality | null>;

  // 액션들
  refreshWeather: () => Promise<void>;
  requestLocationPermission: () => Promise<void>;
  setLocation: (lat: number, lon: number) => Promise<void>;

  // 로딩/에러 상태
  isLoading: boolean;
  error: Error | null;
}

const WeatherContext = createContext<WeatherContextValue | null>(null);

export interface WeatherProviderProps {
  children: ReactNode;
}

/**
 * Weather Provider 컴포넌트
 * GPS 위치 관리, 날씨 데이터 캐싱, 오프라인 처리 포함
 */
export function WeatherProvider({ children }: WeatherProviderProps) {
  const queryClient = useQueryClient();

  // 위치 및 권한 상태
  const [currentLocation, setCurrentLocation] = useState<WeatherLocation | null>(null);
  const [locationPermission, setLocationPermission] = useState<
    "granted" | "denied" | "prompt" | null
  >(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Repository 초기화
  useEffect(() => {
    weatherRepository.init().catch(console.error);
  }, []);

  // 온라인 상태 모니터링
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

  // 날짜 변경 시점 캐시 무효화 (어제 데이터)
  useEffect(() => {
    const checkDateChange = () => {
      const now = new Date();
      const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000); // KST 변환
      const currentDate = kstNow.toISOString().slice(0, 10);

      // 로컬 스토리지에 저장된 마지막 확인 날짜
      const lastCheckedDate = localStorage.getItem("weather_last_date_check");

      if (lastCheckedDate !== currentDate) {
        // 날짜가 변경됨 - 어제 데이터 캐시 무효화
        queryClient
          .invalidateQueries({
            queryKey: ["weather", "yesterday"],
            exact: false,
          })
          .catch(console.error);

        // 새로운 날짜 저장
        localStorage.setItem("weather_last_date_check", currentDate);
      }
    };

    // 컴포넌트 마운트 시 즉시 확인
    checkDateChange();

    // 1분마다 날짜 변경 확인
    const interval = setInterval(checkDateChange, 60 * 1000);

    return () => clearInterval(interval);
  }, [queryClient]);

  // GPS 권한 상태 확인
  const checkLocationPermission = useCallback(async () => {
    if (!navigator.permissions) return;

    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      setLocationPermission(result.state as "granted" | "denied" | "prompt");

      result.addEventListener("change", () => {
        setLocationPermission(result.state as "granted" | "denied" | "prompt");
      });
    } catch (error) {
      console.warn("Failed to check location permission:", error);
    }
  }, []);

  // GPS 위치 가져오기
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

  // 위치 업데이트
  const updateLocation = useCallback(
    async (lat: number, lon: number) => {
      try {
        const location = await weatherRepository.getOrCreateLocation(lat, lon);
        setCurrentLocation(location);

        // 위치 변경 시 날씨 쿼리 무효화
        queryClient.invalidateQueries({ queryKey: ["weather"] });
      } catch (error) {
        console.error("Failed to update location:", error);
      }
    },
    [queryClient]
  );

  // 초기 위치 설정
  useEffect(() => {
    const initializeLocation = async () => {
      await checkLocationPermission();

      if (locationPermission === "granted") {
        try {
          const position = await getCurrentPosition();
          await updateLocation(position.coords.latitude, position.coords.longitude);
        } catch (error) {
          console.warn("Failed to get current position, using default location:", error);
          setCurrentLocation(DEFAULT_LOCATION);
        }
      } else {
        // 권한 없음 또는 확인 중 - 기본 위치 사용
        setCurrentLocation(DEFAULT_LOCATION);
      }
    };

    initializeLocation();
  }, [locationPermission, checkLocationPermission, getCurrentPosition, updateLocation]);

  // 날씨 데이터 쿼리들
  const locationId = currentLocation?.id || "default";

  const nowQuery = useQuery({
    queryKey: ["weather", "now", locationId],
    queryFn: () => weatherRepository.getNow(locationId),
    enabled: !!locationId && isOnline,
    staleTime: 1000 * 60 * 10, // 10분
    gcTime: 1000 * 60 * 60, // 1시간
    retry: (failureCount, error) => {
      // 네트워크 에러가 아니면 재시도하지 않음
      if (!isOnline) return false;
      // 4xx 에러는 재시도하지 않음
      if (error instanceof Error && error.message.includes("4")) return false;
      return failureCount < 2;
    },
  });

  const hourlyQuery = useQuery({
    queryKey: ["weather", "hourly", locationId],
    queryFn: () => weatherRepository.getHourly(locationId),
    enabled: !!locationId && isOnline,
    staleTime: 1000 * 60 * 60, // 1시간
    gcTime: 1000 * 60 * 60 * 6, // 6시간
    retry: (failureCount, error) => {
      if (!isOnline) return false;
      if (error instanceof Error && error.message.includes("4")) return false;
      return failureCount < 2;
    },
  });

  const dailyQuery = useQuery({
    queryKey: ["weather", "daily", locationId],
    queryFn: () => weatherRepository.getDaily(locationId),
    enabled: !!locationId && isOnline,
    staleTime: 1000 * 60 * 60 * 6, // 6시간
    gcTime: 1000 * 60 * 60 * 24, // 24시간
    retry: (failureCount, error) => {
      if (!isOnline) return false;
      if (error instanceof Error && error.message.includes("4")) return false;
      return failureCount < 2;
    },
  });

  const airQualityQuery = useQuery({
    queryKey: ["weather", "airQuality", locationId],
    queryFn: () => weatherRepository.getAirQuality(locationId),
    enabled: !!locationId && isOnline,
    staleTime: 1000 * 60 * 60, // 1시간
    gcTime: 1000 * 60 * 60 * 6, // 6시간
    retry: (failureCount, error) => {
      if (!isOnline) return false;
      if (error instanceof Error && error.message.includes("4")) return false;
      return failureCount < 2;
    },
  });

  // 액션 함수들
  const refreshWeather = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["weather"] });
  }, [queryClient]);

  const requestLocationPermission = useCallback(async () => {
    try {
      const position = await getCurrentPosition();
      await updateLocation(position.coords.latitude, position.coords.longitude);
    } catch (error) {
      console.error("Failed to request location permission:", error);
      throw error;
    }
  }, [getCurrentPosition, updateLocation]);

  const setLocation = useCallback(
    async (lat: number, lon: number) => {
      await updateLocation(lat, lon);
    },
    [updateLocation]
  );

  // 통합 로딩/에러 상태
  const isLoading =
    nowQuery.isLoading ||
    hourlyQuery.isLoading ||
    dailyQuery.isLoading ||
    airQualityQuery.isLoading;
  const error = nowQuery.error || hourlyQuery.error || dailyQuery.error || airQualityQuery.error;

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
    error: error as Error | null,
  };

  return <WeatherContext.Provider value={contextValue}>{children}</WeatherContext.Provider>;
}

/**
 * Weather Context 사용 훅
 */
export function useWeatherContext(): WeatherContextValue {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error("useWeatherContext must be used within a WeatherProvider");
  }
  return context;
}
