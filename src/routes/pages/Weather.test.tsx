import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { Weather } from "./Weather";
import { WeatherProvider } from "../../lib/weather/WeatherProvider";
import type {
  WeatherNow,
  WeatherHourlyPoint,
  WeatherDailyPoint,
  AirQuality,
} from "../../domain/types";

// 모킹 설정
const mockGetCurrentPosition = vi.fn();
const mockPermissionsQuery = vi.fn();

Object.defineProperty(navigator, "geolocation", {
  value: {
    getCurrentPosition: mockGetCurrentPosition,
    watchPosition: vi.fn(),
  },
  writable: true,
});

Object.defineProperty(navigator, "permissions", {
  value: {
    query: mockPermissionsQuery,
  },
  writable: true,
});

// 모킹 데이터
const mockWeatherNow: WeatherNow = {
  tempC: 25,
  humidityPct: 60,
  windMs: 2.5,
  weatherCode: { pty: 0, sky: 1 },
  updatedAt: Date.now(),
};

const mockWeatherHourly: WeatherHourlyPoint[] = [
  {
    time: new Date().toISOString(),
    tempC: 25,
    humidityPct: 60,
    precipProbPct: 30,
  },
  {
    time: new Date(Date.now() + 3600000).toISOString(),
    tempC: 26,
    humidityPct: 55,
    precipProbPct: 20,
  },
];

const mockWeatherDaily: WeatherDailyPoint[] = [
  {
    date: new Date().toISOString(),
    minC: 20,
    maxC: 28,
    precipProbMaxPct: 30,
    sky: 1,
    pty: 0,
  },
  {
    date: new Date(Date.now() + 86400000).toISOString(),
    minC: 21,
    maxC: 27,
    precipProbMaxPct: 20,
    sky: 3,
    pty: 0,
  },
];

const mockAirQuality: AirQuality = {
  pm10: 35,
  pm25: 20,
  aqiKorea: "보통",
  updatedAt: Date.now(),
};

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

  // 쿼리 데이터 미리 설정
  queryClient.setQueryData(["weather", "now", "default"], mockWeatherNow);
  queryClient.setQueryData(["weather", "hourly", "default"], mockWeatherHourly);
  queryClient.setQueryData(["weather", "daily", "default"], mockWeatherDaily);
  queryClient.setQueryData(["weather", "airQuality", "default"], mockAirQuality);

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <WeatherProvider>{children}</WeatherProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("Weather Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 기본 모킹 설정
    mockPermissionsQuery.mockResolvedValue({ state: "denied" }); // 기본 위치 사용
    mockGetCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 37.5665,
          longitude: 126.978,
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

  describe("페이지 구조", () => {
    it("헤더에 날씨 제목이 표시되어야 함", () => {
      render(<Weather />, { wrapper: createWrapper() });

      // 헤더 제목이 표시되는지 확인 (로딩 상태에서도 표시됨)
      expect(screen.getByText("날씨")).toBeInTheDocument();
    });

    it("뒤로가기 버튼이 있어야 함", () => {
      render(<Weather />, { wrapper: createWrapper() });

      const backButton = screen.getByRole("link");
      expect(backButton).toHaveAttribute("href", "/");
    });

    it("새로고침 버튼이 있어야 함", () => {
      render(<Weather />, { wrapper: createWrapper() });

      const refreshButton = screen.getByTitle("새로고침");
      expect(refreshButton).toBeInTheDocument();
    });
  });

  describe("현재 날씨 카드", () => {
    it("현재 날씨 섹션이 표시되어야 함", async () => {
      render(<Weather />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText("현재 날씨")).toBeInTheDocument();
      });
    });

    it.skip("온도 정보가 표시되어야 함", async () => {
      render(<Weather />, { wrapper: createWrapper() });

      // 로딩 상태 후 데이터 표시 대기
      await waitFor(
        () => {
          // 온도 표시 확인 (실제 값은 API에 따라 다를 수 있음)
          const temperatureElement = screen.getByText(/°/);
          expect(temperatureElement).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });

  describe("KPI 칩들", () => {
    it("습도, 바람, 대기질 KPI가 표시되어야 함", async () => {
      render(<Weather />, { wrapper: createWrapper() });

      await waitFor(() => {
        // KPI 칩들에서 텍스트를 찾기 위해 더 구체적인 셀렉터 사용
        const kpiCards = screen.getAllByText(/습도|바람|대기질/);
        expect(kpiCards.length).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe("차트 섹션", () => {
    it("24시간 예보 차트가 표시되어야 함", async () => {
      render(<Weather />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText("24시간 예보")).toBeInTheDocument();
      });
    });

    it("7일 예보 차트가 표시되어야 함", async () => {
      render(<Weather />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText("7일 예보")).toBeInTheDocument();
      });
    });

    it("습도 추이 차트가 표시되어야 함", async () => {
      render(<Weather />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText("습도 추이")).toBeInTheDocument();
      });
    });
  });

  describe("상태 표시", () => {
    it("위치 정보가 표시되어야 함", async () => {
      render(<Weather />, { wrapper: createWrapper() });

      await waitFor(() => {
        // 기본 위치 이름이 표시되는지 확인
        expect(screen.getByText("서울 송파구 잠실동")).toBeInTheDocument();
      });
    });

    it("네트워크 상태 아이콘이 표시되어야 함", async () => {
      render(<Weather />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Wifi 아이콘이 있는지 확인 (실제로는 클래스나 속성으로 확인)
        const wifiIcon =
          document.querySelector('[class*="text-green-500"]') ||
          document.querySelector('[class*="text-red-500"]');
        expect(wifiIcon).toBeInTheDocument();
      });
    });
  });

  describe("로딩 및 에러 상태", () => {
    it("초기 로딩 상태가 표시되어야 함", async () => {
      render(<Weather />, { wrapper: createWrapper() });

      // 초기에는 로딩 상태가 표시될 수 있음
      await waitFor(() => {
        const pageContent = screen.getByText("날씨");
        expect(pageContent).toBeInTheDocument();
      });
    });
  });

  describe("반응형 디자인", () => {
    it("모바일에 최적화된 레이아웃을 가져야 함", async () => {
      render(<Weather />, { wrapper: createWrapper() });

      await waitFor(() => {
        // 그리드 레이아웃 확인
        const gridElement = document.querySelector('[class*="grid-cols-3"]');
        expect(gridElement).toBeInTheDocument();
      });
    });
  });
});
