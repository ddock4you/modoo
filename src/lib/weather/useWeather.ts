/**
 * Weather 커스텀 훅들
 * 날씨 데이터 조회를 위한 편리한 API 제공
 */

import { useWeatherContext } from "./WeatherProvider";

/**
 * 기본 날씨 데이터 훅
 * 현재 위치의 모든 날씨 데이터를 반환
 */
export function useWeather() {
  const {
    currentLocation,
    isOnline,
    nowQuery,
    hourlyQuery,
    dailyQuery,
    airQualityQuery,
    refreshWeather,
    isLoading,
    error,
  } = useWeatherContext();

  return {
    // 위치 정보
    location: currentLocation,

    // 날씨 데이터
    now: nowQuery.data,
    hourly: hourlyQuery.data,
    daily: dailyQuery.data,
    airQuality: airQualityQuery.data,

    // 상태 정보
    isOnline,
    isLoading,
    error,

    // 개별 쿼리 상태
    nowLoading: nowQuery.isLoading,
    hourlyLoading: hourlyQuery.isLoading,
    dailyLoading: dailyQuery.isLoading,
    airQualityLoading: airQualityQuery.isLoading,

    nowError: nowQuery.error,
    hourlyError: hourlyQuery.error,
    dailyError: dailyQuery.error,
    airQualityError: airQualityQuery.error,

    // 액션
    refreshWeather,

    // 유틸리티
    hasData: !!(nowQuery.data || hourlyQuery.data || dailyQuery.data || airQualityQuery.data),
    isStale:
      nowQuery.isStale || hourlyQuery.isStale || dailyQuery.isStale || airQualityQuery.isStale,
  };
}

/**
 * 현재 날씨 전용 훅
 */
export function useCurrentWeather() {
  const { nowQuery, isOnline } = useWeatherContext();

  return {
    data: nowQuery.data,
    isLoading: nowQuery.isLoading,
    error: nowQuery.error,
    isStale: nowQuery.isStale,
    isOnline,
    lastUpdated: nowQuery.dataUpdatedAt,
  };
}

/**
 * 시간별 날씨 전용 훅
 */
export function useHourlyWeather() {
  const { hourlyQuery, isOnline } = useWeatherContext();

  return {
    data: hourlyQuery.data,
    isLoading: hourlyQuery.isLoading,
    error: hourlyQuery.error,
    isStale: hourlyQuery.isStale,
    isOnline,
    lastUpdated: hourlyQuery.dataUpdatedAt,
  };
}

/**
 * 일별 날씨 전용 훅
 */
export function useDailyWeather() {
  const { dailyQuery, isOnline } = useWeatherContext();

  return {
    data: dailyQuery.data,
    isLoading: dailyQuery.isLoading,
    error: dailyQuery.error,
    isStale: dailyQuery.isStale,
    isOnline,
    lastUpdated: dailyQuery.dataUpdatedAt,
  };
}

/**
 * 대기질 전용 훅
 */
export function useAirQuality() {
  const { airQualityQuery, isOnline } = useWeatherContext();

  return {
    data: airQualityQuery.data,
    isLoading: airQualityQuery.isLoading,
    error: airQualityQuery.error,
    isStale: airQualityQuery.isStale,
    isOnline,
    lastUpdated: airQualityQuery.dataUpdatedAt,
  };
}

/**
 * 날씨 요약 정보 훅
 * 대시보드 등에서 간단한 요약 정보를 제공
 */
export function useWeatherSummary() {
  const { currentLocation, nowQuery, airQualityQuery, isOnline } = useWeatherContext();

  const now = nowQuery.data;
  const airQuality = airQualityQuery.data;

  return {
    location: currentLocation,

    // 현재 날씨 요약
    temperature: now?.temperature,
    condition: now?.condition,
    humidity: now?.humidity,
    windSpeed: now?.windSpeed,

    // 대기질 요약
    airQualityGrade: airQuality?.grade,
    pm10: airQuality?.pm10,
    pm25: airQuality?.pm25,

    // 상태
    isOnline,
    hasData: !!(now || airQuality),
    isLoading: nowQuery.isLoading || airQualityQuery.isLoading,
    error: nowQuery.error || airQualityQuery.error,
  };
}

/**
 * 위치 관리 훅
 */
export function useWeatherLocation() {
  const { currentLocation, locationPermission, requestLocationPermission, setLocation } =
    useWeatherContext();

  return {
    currentLocation,
    permission: locationPermission,
    requestPermission: requestLocationPermission,
    setLocation,
    hasPermission: locationPermission === "granted",
    isDefaultLocation: currentLocation?.id === "default",
  };
}

/**
 * 날씨 아이콘 매핑 훅
 * PTY/SKY 코드에 따른 Lucide 아이콘 반환
 */
export function useWeatherIcon() {
  const getIconName = (pty?: number, sky?: number): string => {
    // 강수 우선 (PTY)
    if (pty === 1 || pty === 2 || pty === 4) return "cloud-rain"; // 비
    if (pty === 3) return "cloud-snow"; // 눈

    // 맑음/흐림 (SKY)
    if (sky === 1) return "sun"; // 맑음
    if (sky === 3) return "cloud"; // 구름많음
    if (sky === 4) return "cloud"; // 흐림

    return "sun"; // 기본값
  };

  const getConditionText = (pty?: number, sky?: number): string => {
    if (pty === 1 || pty === 2 || pty === 4) return "비";
    if (pty === 3) return "눈";
    if (sky === 1) return "맑음";
    if (sky === 3) return "구름많음";
    if (sky === 4) return "흐림";
    return "맑음";
  };

  return {
    getIconName,
    getConditionText,
  };
}

/**
 * 날씨 포맷팅 유틸리티 훅
 */
export function useWeatherFormat() {
  const formatTemperature = (temp?: number): string => {
    if (temp === undefined || temp === null) return "--";
    return `${Math.round(temp)}°`;
  };

  const formatHumidity = (humidity?: number): string => {
    if (humidity === undefined || humidity === null) return "--";
    return `${Math.round(humidity)}%`;
  };

  const formatWindSpeed = (speed?: number): string => {
    if (speed === undefined || speed === null) return "--";
    return `${speed.toFixed(1)}m/s`;
  };

  const formatAirQuality = (grade?: string, value?: number): string => {
    if (!grade) return "--";
    return grade;
  };

  const formatTime = (timestamp?: number): string => {
    if (!timestamp) return "--";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return "--";
    const date = new Date(timestamp);
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  };

  return {
    formatTemperature,
    formatHumidity,
    formatWindSpeed,
    formatAirQuality,
    formatTime,
    formatDate,
  };
}
