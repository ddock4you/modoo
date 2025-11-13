/**
 * WeatherWidget 컴포넌트 테스트
 */

import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { WeatherWidget } from "./WeatherWidget";

// 테스트용 래퍼 컴포넌트
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

// Weather 훅들 모킹
const mockUseWeatherSummary = vi.fn();
const mockUseCurrentWeather = vi.fn();
const mockUseDailyWeather = vi.fn();
const mockUseWeatherIcon = vi.fn();
const mockUseWeatherFormat = vi.fn();
const mockUseHourlyWeather = vi.fn();

vi.mock("../../lib/weather/useWeather", () => ({
  useWeatherSummary: () => mockUseWeatherSummary(),
  useCurrentWeather: () => mockUseCurrentWeather(),
  useDailyWeather: () => mockUseDailyWeather(),
  useWeatherIcon: () => mockUseWeatherIcon(),
  useWeatherFormat: () => mockUseWeatherFormat(),
  useHourlyWeather: () => mockUseHourlyWeather(),
}));

// recharts와 차트 컴포넌트 모킹
vi.mock("./HourlyChart", () => ({
  HourlyChart: () => <div data-testid="hourly-chart">HourlyChart Mock</div>,
}));

vi.mock("./HumidityChart", () => ({
  HumidityChart: () => <div data-testid="humidity-chart">HumidityChart Mock</div>,
}));

describe("WeatherWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 기본 모킹 값들
    mockUseCurrentWeather.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      isStale: false,
      lastUpdated: Date.now(),
    });

    mockUseDailyWeather.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      isStale: false,
      lastUpdated: Date.now(),
    });

    mockUseWeatherIcon.mockReturnValue({
      getIconName: vi.fn().mockReturnValue("sun"),
      getConditionText: vi.fn().mockReturnValue("맑음"),
    });

    mockUseWeatherFormat.mockReturnValue({
      formatTemperature: vi.fn().mockImplementation((temp) => (temp ? `${temp}°` : "--")),
      formatHumidity: vi.fn().mockImplementation((humidity) => (humidity ? `${humidity}%` : "--")),
      formatWindSpeed: vi.fn().mockImplementation((speed) => (speed ? `${speed}m/s` : "--")),
      formatAirQuality: vi.fn().mockImplementation((grade) => grade || "--"),
    });
  });

  it("로딩 상태를 올바르게 표시한다", () => {
    mockUseWeatherSummary.mockReturnValue({
      isLoading: true,
      error: null,
      hasData: false,
      isOnline: true,
      location: null,
    });
    mockUseHourlyWeather.mockReturnValue({ data: null });

    render(
      <TestWrapper>
        <WeatherWidget />
      </TestWrapper>
    );

    expect(screen.getByText("날씨")).toBeInTheDocument();
    expect(screen.getByText("로딩 중...")).toBeInTheDocument();
    // RefreshCw 아이콘 확인 (SVG)
    const refreshIcon = document.querySelector(".lucide-refresh-cw");
    expect(refreshIcon).toHaveClass("animate-spin");
  });

  it("에러 상태를 올바르게 표시한다", () => {
    mockUseWeatherSummary.mockReturnValue({
      isLoading: false,
      error: new Error("날씨 정보 조회 실패"),
      hasData: false,
      isOnline: true,
      location: { id: "default", name: "서울 송파구 잠실동" },
    });
    mockUseHourlyWeather.mockReturnValue({ data: null });

    render(
      <TestWrapper>
        <WeatherWidget />
      </TestWrapper>
    );

    expect(screen.getByText("날씨 정보를 불러올 수 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("다시 시도")).toBeInTheDocument();
  });

  it("오프라인 상태를 표시한다", () => {
    mockUseWeatherSummary.mockReturnValue({
      isLoading: false,
      error: new Error("네트워크 오류"),
      hasData: false,
      isOnline: false,
      location: { id: "default", name: "서울 송파구 잠실동" },
    });
    mockUseHourlyWeather.mockReturnValue({ data: null });

    render(
      <TestWrapper>
        <WeatherWidget />
      </TestWrapper>
    );

    expect(screen.getByText("오프라인")).toBeInTheDocument();
  });

  it("정상적인 날씨 데이터를 표시한다", () => {
    mockUseWeatherSummary.mockReturnValue({
      isLoading: false,
      error: null,
      hasData: true,
      isOnline: true,
      location: { id: "default", name: "서울 송파구 잠실동" },
      temperature: 23,
      humidity: 65,
      windSpeed: 2.1,
      airQualityGrade: "보통",
      pm25: 25,
      now: { pty: 0, sky: 1 }, // 맑음
    });

    mockUseCurrentWeather.mockReturnValue({
      data: {
        tempC: 23,
        humidityPct: 65,
        windMs: 2.1,
        weatherCode: { pty: 0, sky: 1 },
        updatedAt: Date.now(),
      },
      isLoading: false,
      error: null,
      isStale: false,
      lastUpdated: Date.now(),
    });

    mockUseHourlyWeather.mockReturnValue({
      data: Array.from({ length: 24 }, (_, i) => ({
        time: new Date(Date.now() + i * 60 * 60 * 1000).toISOString(),
        tempC: 20 + Math.sin(i / 4) * 5, // 파도 형태의 온도 변화
        humidityPct: 50 + Math.cos(i / 6) * 20, // 습도 변화
        precipProbPct: i % 6 === 0 ? 30 : 0, // 6시간마다 강수확률
      })),
    });

    render(
      <TestWrapper>
        <WeatherWidget />
      </TestWrapper>
    );

    // 위치 정보 확인
    expect(screen.getByText("서울 송파구 잠실동")).toBeInTheDocument();

    // 온도 표시 확인 (23°와 맑음이 같은 요소에 있으므로 통합 확인)
    expect(screen.getByText(/23°/)).toBeInTheDocument();

    // 날씨 상태 확인 (23° 맑음 형태로 표시됨)
    expect(screen.getByText(/맑음/)).toBeInTheDocument();

    // 추가 정보 확인 (WeatherWidget에서는 온도와 날씨 상태만 표시)

    // 상세보기 링크 확인 (텍스트가 "오늘의 날씨"로 변경됨)
    expect(screen.getByText("오늘의 날씨")).toBeInTheDocument();

    // HourlyChart 컴포넌트가 렌더링되는지 확인
    // (실제로는 recharts 컴포넌트가 렌더링되므로 DOM에 특정 요소가 있는지 확인)
    const chartContainer =
      document.querySelector('[data-testid="hourly-chart"]') ||
      document.querySelector(".recharts-wrapper");
    expect(chartContainer).toBeInTheDocument();
  });

  it("상세보기 링크를 클릭할 수 있다", async () => {
    const user = userEvent.setup();

    mockUseWeatherSummary.mockReturnValue({
      isLoading: false,
      error: null,
      hasData: true,
      isOnline: true,
      location: { id: "default", name: "서울 송파구 잠실동" },
      temperature: 23,
    });
    mockUseHourlyWeather.mockReturnValue({ data: null });

    render(
      <TestWrapper>
        <WeatherWidget />
      </TestWrapper>
    );

    const link = screen.getByRole("link", { name: /오늘의 날씨/ });
    expect(link).toHaveAttribute("href", "/weather");

    await user.click(link);
    // React Router로 인해 실제 네비게이션은 모킹되어 있으므로 클릭 가능성만 확인
  });

  it("시간별 차트를 표시한다", () => {
    mockUseWeatherSummary.mockReturnValue({
      isLoading: false,
      error: null,
      hasData: true,
      isOnline: true,
      location: { id: "default", name: "서울 송파구 잠실동" },
      temperature: 23,
    });

    mockUseHourlyWeather.mockReturnValue({
      data: Array.from({ length: 24 }, (_, i) => ({
        time: new Date(Date.now() + i * 60 * 60 * 1000).toISOString(),
        tempC: 18 + Math.sin(i / 3) * 8, // 24시간 온도 변화
        humidityPct: 45 + Math.cos(i / 4) * 25,
        precipProbPct: i % 8 === 0 ? 40 : 10, // 8시간마다 강수확률 증가
      })),
    });

    render(
      <TestWrapper>
        <WeatherWidget />
      </TestWrapper>
    );

    // 섹션 제목 확인
    expect(screen.getByText("시간대별 날씨 예보")).toBeInTheDocument();
    expect(screen.getByText("시간대별 습도 예보")).toBeInTheDocument();

    // HourlyChart와 HumidityChart가 렌더링되는지 확인 (모킹된 컴포넌트)
    expect(screen.getByText("HourlyChart Mock")).toBeInTheDocument();
    expect(screen.getByText("HumidityChart Mock")).toBeInTheDocument();
  });

  it("아이콘을 올바르게 표시한다", () => {
    mockUseWeatherSummary.mockReturnValue({
      isLoading: false,
      error: null,
      hasData: true,
      isOnline: true,
      location: { id: "default", name: "서울 송파구 잠실동" },
      temperature: 23,
      now: { pty: 1, sky: 3 }, // 비
    });

    mockUseWeatherIcon.mockReturnValue({
      getIconName: vi.fn().mockReturnValue("cloud-rain"),
      getConditionText: vi.fn().mockReturnValue("비"),
    });

    mockUseHourlyWeather.mockReturnValue({
      data: Array.from({ length: 24 }, (_, i) => ({
        time: new Date(Date.now() + i * 60 * 60 * 1000).toISOString(),
        tempC: 20 + Math.sin(i / 4) * 5,
        humidityPct: 50 + Math.cos(i / 6) * 20,
        precipProbPct: i % 6 === 0 ? 30 : 0,
        pty: i % 8 === 0 ? 1 : 0, // 8시간마다 비
        sky: 3, // 구름많음
      })),
    });

    render(
      <TestWrapper>
        <WeatherWidget />
      </TestWrapper>
    );

    // 날씨 아이콘과 습도 아이콘이 표시되는지 확인
    const weatherIcons = screen.getAllByText("🌧️");
    expect(weatherIcons.length).toBeGreaterThan(0);

    // 습도 아이콘들도 확인 (💧 기본 아이콘)
    const humidityIcons = screen.getAllByText("💧");
    expect(humidityIcons.length).toBeGreaterThan(0);
  });

  it("데이터가 없을 때 기본값을 표시한다", () => {
    mockUseWeatherSummary.mockReturnValue({
      isLoading: false,
      error: null,
      hasData: true,
      isOnline: true,
      location: { id: "default", name: "알 수 없음" },
      temperature: null,
      humidity: null,
      windSpeed: null,
    });

    mockUseCurrentWeather.mockReturnValue({
      data: {
        tempC: null,
        humidityPct: null,
        windMs: null,
        weatherCode: { pty: 0, sky: 1 }, // 맑음
        updatedAt: Date.now(),
      },
      isLoading: false,
      error: null,
      isStale: false,
      lastUpdated: Date.now(),
    });

    mockUseHourlyWeather.mockReturnValue({ data: null });

    render(
      <TestWrapper>
        <WeatherWidget />
      </TestWrapper>
    );

    // 기본값 표시 확인 (온도가 null이므로 -- 표시)
    expect(screen.getByText(/-+/)).toBeInTheDocument();
    // 맑음 텍스트는 모킹된 getConditionText에서 반환됨
    expect(screen.getByText(/맑음/)).toBeInTheDocument();
  });
});
