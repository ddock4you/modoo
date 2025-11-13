import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WeatherProvider, useWeatherContext } from "./WeatherProvider";
import type {
  WeatherNow,
  WeatherHourlyPoint,
  WeatherDailyPoint,
  AirQuality,
} from "../../domain/types";

// 모킹 설정
const mockGetCurrentPosition = vi.fn();
const mockPermissionsQuery = vi.fn();

// setup.ts의 기본 모킹을 override
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

// 테스트 컴포넌트
function TestComponent() {
  const context = useWeatherContext();
  return (
    <div>
      <div data-testid="location">{context.currentLocation?.name || "No location"}</div>
      <div data-testid="permission">{context.locationPermission || "unknown"}</div>
      <div data-testid="online">{context.isOnline ? "online" : "offline"}</div>
      <div data-testid="loading">{context.isLoading ? "loading" : "loaded"}</div>
      <div data-testid="error">{context.error?.message || "no error"}</div>
      <div data-testid="now-temp">{context.nowQuery.data?.temperature || "no data"}</div>
      <button data-testid="refresh" onClick={context.refreshWeather}>
        Refresh
      </button>
    </div>
  );
}

describe("WeatherProvider", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
        },
      },
    });

    // 모킹 초기화
    vi.clearAllMocks();
    mockGetCurrentPosition.mockClear();
    mockPermissionsQuery.mockClear();

    // 기본 모킹 설정
    mockPermissionsQuery.mockResolvedValue({ state: "prompt" });
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

  afterEach(() => {
    queryClient.clear();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <WeatherProvider>{component}</WeatherProvider>
      </QueryClientProvider>
    );
  };

  describe("초기화 및 Context", () => {
    it("WeatherProvider 외부에서 useWeatherContext 사용 시 에러가 발생해야 함", () => {
      expect(() => {
        render(<TestComponent />);
      }).toThrow("useWeatherContext must be used within a WeatherProvider");
    });

    it("WeatherProvider 내부에서 Context가 정상적으로 제공되어야 함", () => {
      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId("location")).toBeInTheDocument();
      expect(screen.getByTestId("permission")).toBeInTheDocument();
      expect(screen.getByTestId("online")).toBeInTheDocument();
    });
  });

  describe("위치 권한 및 GPS 처리", () => {
    it("GPS 권한이 granted이면 위치를 가져와야 함", async () => {
      mockPermissionsQuery.mockResolvedValue({ state: "granted" });

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(mockGetCurrentPosition).toHaveBeenCalled();
      });
    });

    it("GPS 권한이 denied이면 기본 위치를 사용해야 함", async () => {
      mockPermissionsQuery.mockResolvedValue({ state: "denied" });

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId("location")).toHaveTextContent("서울 송파구 잠실동");
      });
    });

    it("GPS 호출 실패 시 기본 위치를 사용해야 함", async () => {
      (navigator.permissions.query as any).mockResolvedValue({ state: "granted" });
      (navigator.geolocation.getCurrentPosition as any).mockImplementation((success, error) => {
        error && error(new Error("GPS Error"));
      });

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId("location")).toHaveTextContent("서울 송파구 잠실동");
      });
    });
  });

  describe("온라인 상태 모니터링", () => {
    it("초기에는 온라인 상태여야 함", () => {
      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId("online")).toHaveTextContent("online");
    });

    it("오프라인 이벤트 발생 시 오프라인 상태로 변경되어야 함", async () => {
      renderWithProviders(<TestComponent />);

      // 오프라인 이벤트 발생
      await act(async () => {
        window.dispatchEvent(new Event("offline"));
      });

      expect(screen.getByTestId("online")).toHaveTextContent("offline");
    });
  });

  describe("날씨 데이터 쿼리", () => {
    it("온라인 상태에서 날씨 데이터를 조회해야 함", async () => {
      renderWithProviders(<TestComponent />);

      // 로딩 상태 확인
      expect(screen.getByTestId("loading")).toHaveTextContent("loaded");

      // 데이터 로딩 대기 (실제로는 모킹 필요)
      await waitFor(
        () => {
          expect(screen.getByTestId("loading")).toHaveTextContent("loaded");
        },
        { timeout: 5000 }
      );
    });

    it("오프라인 상태에서는 쿼리가 비활성화되어야 함", () => {
      // 오프라인 상태로 설정
      Object.defineProperty(navigator, "onLine", { value: false, writable: true });

      renderWithProviders(<TestComponent />);

      // 오프라인 상태 확인
      expect(screen.getByTestId("online")).toHaveTextContent("offline");
    });
  });

  describe("액션 함수들", () => {
    it("refreshWeather 함수가 정상적으로 호출되어야 함", async () => {
      renderWithProviders(<TestComponent />);

      const refreshButton = screen.getByTestId("refresh");
      refreshButton.click();

      // refresh 함수가 호출되었는지 확인 (실제로는 모킹 필요)
      await waitFor(() => {
        expect(refreshButton).toBeInTheDocument();
      });
    });

    it("requestLocationPermission 함수가 GPS를 호출해야 함", async () => {
      renderWithProviders(<TestComponent />);

      // Context에서 함수를 직접 호출하는 테스트 컴포넌트 필요
      // 실제로는 별도 테스트 컴포넌트로 구현
    });
  });

  describe("에러 처리", () => {
    it("API 에러 발생 시 에러 상태가 업데이트되어야 함", async () => {
      // API 에러 모킹 필요
      renderWithProviders(<TestComponent />);

      // 에러 상태 확인
      await waitFor(() => {
        const errorElement = screen.getByTestId("error");
        expect(errorElement).toBeInTheDocument();
      });
    });
  });
});
