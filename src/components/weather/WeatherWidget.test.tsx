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
const mockUseWeatherIcon = vi.fn();
const mockUseWeatherFormat = vi.fn();
const mockUseHourlyWeather = vi.fn();

vi.mock("../../lib/weather/useWeather", () => ({
  useWeatherSummary: () => mockUseWeatherSummary(),
  useCurrentWeather: () => mockUseCurrentWeather(),
  useWeatherIcon: () => mockUseWeatherIcon(),
  useWeatherFormat: () => mockUseWeatherFormat(),
  useHourlyWeather: () => mockUseHourlyWeather(),
}));

// recharts는 더 이상 사용하지 않음

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

    mockUseHourlyWeather.mockReturnValue({
      data: [
        { time: "2025-11-12T21:00:00.000Z", tempC: 22 },
        { time: "2025-11-12T22:00:00.000Z", tempC: 24 },
      ],
    });

    render(
      <TestWrapper>
        <WeatherWidget />
      </TestWrapper>
    );

    // 위치 정보 확인
    expect(screen.getByText("서울 송파구 잠실동")).toBeInTheDocument();

    // 온도 표시 확인
    expect(screen.getByText("23°")).toBeInTheDocument();

    // 날씨 상태 확인
    expect(screen.getByText("맑음")).toBeInTheDocument();

    // 추가 정보 확인
    expect(screen.getByText("습도 65%")).toBeInTheDocument();
    expect(screen.getByText("바람 2.1m/s")).toBeInTheDocument();

    // 대기질 확인
    expect(screen.getByText("대기질: 보통")).toBeInTheDocument();

    // 상세보기 링크 확인
    expect(screen.getByText("상세 날씨 보기")).toBeInTheDocument();

    // 차트가 렌더링되는지 확인
    expect(screen.getByText("시간별 온도")).toBeInTheDocument();
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

    const link = screen.getByRole("link", { name: /상세 날씨 보기/ });
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
      data: [
        { time: "2025-11-12T21:00:00.000Z", tempC: 22 },
        { time: "2025-11-12T22:00:00.000Z", tempC: 23 },
        { time: "2025-11-12T23:00:00.000Z", tempC: 24 },
      ],
    });

    render(
      <TestWrapper>
        <WeatherWidget />
      </TestWrapper>
    );

    // 차트 설명 텍스트 확인
    expect(screen.getByText("시간별 온도")).toBeInTheDocument();
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
    mockUseHourlyWeather.mockReturnValue({ data: null });

    render(
      <TestWrapper>
        <WeatherWidget />
      </TestWrapper>
    );

    // 비 아이콘이 표시되는지 확인 (이모지로 표시됨)
    expect(screen.getByText("🌧️")).toBeInTheDocument();
    expect(screen.getByText("비")).toBeInTheDocument();
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
    mockUseHourlyWeather.mockReturnValue({ data: null });

    render(
      <TestWrapper>
        <WeatherWidget />
      </TestWrapper>
    );

    // 기본값 표시 확인
    expect(screen.getByText("--")).toBeInTheDocument(); // 온도만 표시됨 (습도, 바람은 null이므로 표시되지 않음)
  });
});
