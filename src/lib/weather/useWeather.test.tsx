import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WeatherProvider } from "@/lib/weather/WeatherProvider";
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

// 모킹 설정 - setup.ts에서 이미 설정됨

// 테스트 래퍼
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

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <WeatherProvider>{children}</WeatherProvider>
    </QueryClientProvider>
  );
}

describe("useWeather hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 기본 모킹 설정 - setup.ts에서 설정된 모킹 사용
    (navigator.permissions.query as any).mockResolvedValue({
      state: "denied",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }); // 기본 위치 사용
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

  describe("useWeather", () => {
    it("기본 날씨 데이터를 반환해야 함", async () => {
      const { result } = renderHook(() => useWeather(), {
        wrapper: createWrapper(),
      });

      // 초기 상태 확인
      expect(result.current.location).toBeDefined();
      expect(result.current.isLoading).toBeDefined();
      expect(result.current.error).toBeDefined();
    });

    it("데이터 존재 여부를 올바르게 판단해야 함", async () => {
      const { result } = renderHook(() => useWeather(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.hasData).toBeDefined();
      });
    });
  });

  describe("useCurrentWeather", () => {
    it("현재 날씨 데이터를 반환해야 함", () => {
      const { result } = renderHook(() => useCurrentWeather(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty("data");
      expect(result.current).toHaveProperty("isLoading");
      expect(result.current).toHaveProperty("error");
      expect(result.current).toHaveProperty("isStale");
      expect(result.current).toHaveProperty("isOnline");
      expect(result.current).toHaveProperty("lastUpdated");
    });
  });

  describe("useHourlyWeather", () => {
    it("시간별 날씨 데이터를 반환해야 함", () => {
      const { result } = renderHook(() => useHourlyWeather(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty("data");
      expect(result.current).toHaveProperty("isLoading");
      expect(result.current).toHaveProperty("error");
      expect(result.current).toHaveProperty("isStale");
      expect(result.current).toHaveProperty("isOnline");
      expect(result.current).toHaveProperty("lastUpdated");
    });
  });

  describe("useDailyWeather", () => {
    it("일별 날씨 데이터를 반환해야 함", () => {
      const { result } = renderHook(() => useDailyWeather(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty("data");
      expect(result.current).toHaveProperty("isLoading");
      expect(result.current).toHaveProperty("error");
      expect(result.current).toHaveProperty("isStale");
      expect(result.current).toHaveProperty("isOnline");
      expect(result.current).toHaveProperty("lastUpdated");
    });
  });

  describe("useAirQuality", () => {
    it("대기질 데이터를 반환해야 함", () => {
      const { result } = renderHook(() => useAirQuality(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty("data");
      expect(result.current).toHaveProperty("isLoading");
      expect(result.current).toHaveProperty("error");
      expect(result.current).toHaveProperty("isStale");
      expect(result.current).toHaveProperty("isOnline");
      expect(result.current).toHaveProperty("lastUpdated");
    });
  });

  describe("useWeatherSummary", () => {
    it("날씨 요약 정보를 반환해야 함", () => {
      const { result } = renderHook(() => useWeatherSummary(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty("location");
      expect(result.current).toHaveProperty("temperature");
      expect(result.current).toHaveProperty("condition");
      expect(result.current).toHaveProperty("humidity");
      expect(result.current).toHaveProperty("airQualityGrade");
      expect(result.current).toHaveProperty("isOnline");
      expect(result.current).toHaveProperty("hasData");
      expect(result.current).toHaveProperty("isLoading");
      expect(result.current).toHaveProperty("error");
    });
  });

  describe("useWeatherLocation", () => {
    it("위치 관련 정보를 반환해야 함", () => {
      const { result } = renderHook(() => useWeatherLocation(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty("currentLocation");
      expect(result.current).toHaveProperty("permission");
      expect(result.current).toHaveProperty("requestPermission");
      expect(result.current).toHaveProperty("setLocation");
      expect(result.current).toHaveProperty("hasPermission");
      expect(result.current).toHaveProperty("isDefaultLocation");
    });

    it("기본 위치 사용 시 isDefaultLocation이 true여야 함", async () => {
      const { result } = renderHook(() => useWeatherLocation(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isDefaultLocation).toBe(true);
      });
    });
  });

  describe("useWeatherIcon", () => {
    it("날씨 아이콘 이름을 반환해야 함", () => {
      const { result } = renderHook(() => useWeatherIcon(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty("getIconName");
      expect(result.current).toHaveProperty("getConditionText");

      // 아이콘 이름 생성 테스트
      const iconName = result.current.getIconName(0, 1); // 맑음
      expect(typeof iconName).toBe("string");

      const conditionText = result.current.getConditionText(0, 1);
      expect(typeof conditionText).toBe("string");
    });

    it("강수 코드를 우선적으로 처리해야 함", () => {
      const { result } = renderHook(() => useWeatherIcon(), {
        wrapper: createWrapper(),
      });

      const rainyIcon = result.current.getIconName(1, 1); // 비
      expect(rainyIcon).toBe("cloud-rain");

      const rainyText = result.current.getConditionText(1, 1);
      expect(rainyText).toBe("비");
    });

    it("강수 코드가 없으면 하늘 상태를 사용해야 함", () => {
      const { result } = renderHook(() => useWeatherIcon(), {
        wrapper: createWrapper(),
      });

      const clearIcon = result.current.getIconName(0, 1); // 맑음
      expect(clearIcon).toBe("sun");

      const cloudyIcon = result.current.getIconName(0, 3); // 구름많음
      expect(cloudyIcon).toBe("cloud");
    });
  });

  describe("useWeatherFormat", () => {
    it("날씨 데이터 포맷팅 함수들을 제공해야 함", () => {
      const { result } = renderHook(() => useWeatherFormat(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty("formatTemperature");
      expect(result.current).toHaveProperty("formatHumidity");
      expect(result.current).toHaveProperty("formatWindSpeed");
      expect(result.current).toHaveProperty("formatAirQuality");
      expect(result.current).toHaveProperty("formatTime");
      expect(result.current).toHaveProperty("formatDate");
    });

    it("온도를 올바르게 포맷팅해야 함", () => {
      const { result } = renderHook(() => useWeatherFormat(), {
        wrapper: createWrapper(),
      });

      expect(result.current.formatTemperature(25.7)).toBe("26°");
      expect(result.current.formatTemperature(undefined)).toBe("--");
      expect(result.current.formatTemperature(undefined)).toBe("--");
    });

    it("습도를 올바르게 포맷팅해야 함", () => {
      const { result } = renderHook(() => useWeatherFormat(), {
        wrapper: createWrapper(),
      });

      expect(result.current.formatHumidity(65.4)).toBe("65%");
      expect(result.current.formatHumidity(undefined)).toBe("--");
    });

    it("풍속을 올바르게 포맷팅해야 함", () => {
      const { result } = renderHook(() => useWeatherFormat(), {
        wrapper: createWrapper(),
      });

      expect(result.current.formatWindSpeed(3.14159)).toBe("3.1m/s");
      expect(result.current.formatWindSpeed(undefined)).toBe("--");
    });

    it("시간을 올바르게 포맷팅해야 함", () => {
      const { result } = renderHook(() => useWeatherFormat(), {
        wrapper: createWrapper(),
      });

      const timestamp = new Date("2024-01-01T15:30:00").getTime();
      const formatted = result.current.formatTime(timestamp);
      expect(formatted).toMatch(/\d{2}:\d{2}/);
    });

    it("날짜를 올바르게 포맷팅해야 함", () => {
      const { result } = renderHook(() => useWeatherFormat(), {
        wrapper: createWrapper(),
      });

      const timestamp = new Date("2024-01-01T15:30:00").getTime();
      const formatted = result.current.formatDate(timestamp);
      // 한국어 locale의 실제 출력 형식 확인
      expect(formatted).toContain("1월 1일");
    });
  });
});
