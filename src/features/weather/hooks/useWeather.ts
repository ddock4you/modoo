import { useEffect, useState } from "react";
import { useWeatherContext } from "@/lib/weather/WeatherProvider";
import { weatherRepository } from "@/lib/weather/WeatherRepository";

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
    location: currentLocation,
    now: nowQuery.data,
    hourly: hourlyQuery.data,
    daily: dailyQuery.data,
    airQuality: airQualityQuery.data,
    isOnline,
    isLoading,
    error,
    nowLoading: nowQuery.isLoading,
    hourlyLoading: hourlyQuery.isLoading,
    dailyLoading: dailyQuery.isLoading,
    airQualityLoading: airQualityQuery.isLoading,
    nowError: nowQuery.error,
    hourlyError: hourlyQuery.error,
    dailyError: dailyQuery.error,
    airQualityError: airQualityQuery.error,
    refreshWeather,
    hasData: !!(nowQuery.data || hourlyQuery.data || dailyQuery.data || airQualityQuery.data),
    isStale:
      nowQuery.isStale || hourlyQuery.isStale || dailyQuery.isStale || airQualityQuery.isStale,
  };
}

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

export function useWeatherSummary() {
  const { currentLocation, nowQuery, airQualityQuery, isOnline } = useWeatherContext();

  const now = nowQuery.data;
  const airQuality = airQualityQuery.data;

  return {
    location: currentLocation,
    temperature: now?.tempC,
    condition: now?.weatherCode,
    humidity: now?.humidityPct,
    windSpeed: now?.windMs,
    airQualityGrade: airQuality?.aqiKorea,
    pm10: airQuality?.pm10,
    pm25: airQuality?.pm25,
    isOnline,
    hasData: !!(now || airQuality),
    isLoading: nowQuery.isLoading || airQualityQuery.isLoading,
    error: nowQuery.error || airQualityQuery.error,
  };
}

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

export function useWeatherIcon() {
  const getIconName = (pty?: number, sky?: number): string => {
    if (pty === 1 || pty === 2 || pty === 4) return "cloud-rain";
    if (pty === 3) return "cloud-snow";

    if (sky === 1) return "sun";
    if (sky === 3) return "cloud";
    if (sky === 4) return "cloud";

    return "sun";
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

  const formatAirQuality = (unit?: "pm10" | "pm25", value?: number | null): string => {
    if (!unit || !value) return "--";
    switch (unit) {
      case "pm10":
        if (value < 30) return "좋음";
        if (value < 80) return "보통";
        if (value < 150) return "나쁨";
        return "매우나쁨";
      case "pm25":
        if (value < 15) return "좋음";
        if (value < 35) return "보통";
        if (value < 75) return "나쁨";
        return "매우나쁨";
      default:
        return "--";
    }
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

export function useYesterdayTemperatureComparison() {
  const { location, now } = useWeather();
  const [comparison, setComparison] = useState<{
    diff: number | undefined;
    isLoading: boolean;
    error: Error | null;
  }>({
    diff: undefined,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!location || !now?.tempC) {
      setComparison({ diff: undefined, isLoading: false, error: null });
      return;
    }

    const fetchYesterdayComparison = async () => {
      setComparison((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const yesterdayData = await weatherRepository.getYesterdayHourly(location.id);

        if (yesterdayData) {
          const { calculateHourlyTemperatureDiff } = await import("@/features/weather/utils");
          const diff = calculateHourlyTemperatureDiff(now.tempC, yesterdayData);

          setComparison({ diff, isLoading: false, error: null });
        } else {
          setComparison({ diff: undefined, isLoading: false, error: null });
        }
      } catch (error) {
        console.error("Failed to fetch yesterday temperature comparison:", error);
        setComparison({
          diff: undefined,
          isLoading: false,
          error: error instanceof Error ? error : new Error("Unknown error"),
        });
      }
    };

    fetchYesterdayComparison();
  }, [location?.id, location, now?.tempC]);

  return comparison;
}
