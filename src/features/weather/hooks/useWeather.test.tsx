import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { WeatherProvider } from "@/providers/WeatherProvider";
import {
  useWeather,
  useCurrentWeather,
  useHourlyWeather,
  useDailyWeather,
  useAirQuality,
  useWeatherSummary,
  useWeatherLocation,
  useWeatherIcon,
  useWeatherFormat,
} from "@/features/weather/hooks/useWeather";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <WeatherProvider>{children}</WeatherProvider>
    </QueryClientProvider>
  );
}

describe("useWeather hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (navigator.permissions.query as any).mockResolvedValue({
      state: "denied",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    (navigator.geolocation.getCurrentPosition as any).mockImplementation((success: any) => {
      success({
        coords: {
          latitude: 37.5139,
          longitude: 127.1025,
          accuracy: 100,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });
    });
  });

  it("기본 날씨 데이터를 반환해야 함", () => {
    const { result } = renderHook(() => useWeather(), { wrapper: createWrapper() });
    expect(result.current.location).toBeDefined();
    expect(result.current.isLoading).toBeDefined();
    expect(result.current.error).toBeDefined();
  });

  it("데이터 존재 여부를 올바르게 판단해야 함", async () => {
    const { result } = renderHook(() => useWeather(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.hasData).toBeDefined();
    });
  });

  it("현재 날씨 훅이 구조를 유지해야 함", () => {
    const { result } = renderHook(() => useCurrentWeather(), { wrapper: createWrapper() });
    expect(result.current).toHaveProperty("data");
    expect(result.current).toHaveProperty("isLoading");
    expect(result.current).toHaveProperty("error");
    expect(result.current).toHaveProperty("isStale");
    expect(result.current).toHaveProperty("isOnline");
    expect(result.current).toHaveProperty("lastUpdated");
  });

  it("시간별/일별/대기질 훅이 구조를 유지해야 함", () => {
    const hourly = renderHook(() => useHourlyWeather(), { wrapper: createWrapper() });
    expect(hourly.result.current).toHaveProperty("data");

    const daily = renderHook(() => useDailyWeather(), { wrapper: createWrapper() });
    expect(daily.result.current).toHaveProperty("data");

    const air = renderHook(() => useAirQuality(), { wrapper: createWrapper() });
    expect(air.result.current).toHaveProperty("data");
  });

  it("날씨 요약 정보를 반환해야 함", () => {
    const { result } = renderHook(() => useWeatherSummary(), { wrapper: createWrapper() });
    expect(result.current).toHaveProperty("location");
    expect(result.current).toHaveProperty("temperature");
    expect(result.current).toHaveProperty("condition");
    expect(result.current).toHaveProperty("humidity");
    expect(result.current).toHaveProperty("airQualityGrade");
    expect(result.current).toHaveProperty("isOnline");
    expect(result.current).toHaveProperty("hasData");
  });

  it("위치 관련 정보를 반환해야 함", async () => {
    const { result } = renderHook(() => useWeatherLocation(), { wrapper: createWrapper() });
    expect(result.current).toHaveProperty("currentLocation");
    expect(result.current).toHaveProperty("permission");
    expect(result.current).toHaveProperty("requestPermission");
    expect(result.current).toHaveProperty("setLocation");
    await waitFor(() => {
      expect(result.current.isDefaultLocation).toBe(true);
    });
  });

  it("아이콘/텍스트 매핑이 동작해야 함", () => {
    const { result } = renderHook(() => useWeatherIcon(), { wrapper: createWrapper() });
    expect(result.current.getIconName(0, 1)).toBe("sun");
    expect(result.current.getIconName(1, 1)).toBe("cloud-rain");
    expect(result.current.getConditionText(1, 1)).toBe("비");
  });

  it("포맷 유틸이 동작해야 함", () => {
    const { result } = renderHook(() => useWeatherFormat(), { wrapper: createWrapper() });
    expect(result.current.formatTemperature(25.7)).toBe("26°");
    expect(result.current.formatTemperature(undefined)).toBe("--");
    expect(result.current.formatHumidity(65.4)).toBe("65%");
    expect(result.current.formatWindSpeed(3.14159)).toBe("3.1m/s");
  });
});
