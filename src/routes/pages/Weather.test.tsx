import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Weather } from "./Weather";

const mockUseWeather = vi.fn();
const mockUseCurrentWeather = vi.fn();
const mockUseWeatherFormat = vi.fn();
const mockUseWeatherIcon = vi.fn();
const mockUseYesterdayTemperatureComparison = vi.fn();

vi.mock("@/features/weather/hooks/useWeather", () => ({
  useWeather: () => mockUseWeather(),
  useCurrentWeather: () => mockUseCurrentWeather(),
  useWeatherFormat: () => mockUseWeatherFormat(),
  useWeatherIcon: () => mockUseWeatherIcon(),
  useYesterdayTemperatureComparison: () => mockUseYesterdayTemperatureComparison(),
}));

vi.mock("@/features/weather/hooks/useLocationSearch", () => ({
  useLocationSearch: () => ({
    searchLocation: vi.fn(),
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/components/dashboard-visual/LocationSection", () => ({
  LocationSection: ({ locationName }: { locationName?: string }) => (
    <div data-testid="location-section">{locationName ?? "(no location)"}</div>
  ),
}));

vi.mock("@/features/weather/components/lists/DailyList", () => ({
  DailyList: () => <div data-testid="daily-list">DailyList Mock</div>,
}));

vi.mock("@/features/weather/components/widget/WeatherWidget", () => ({
  WeatherWidget: () => <div data-testid="weather-widget">WeatherWidget Mock</div>,
}));

vi.mock("@/features/weather/components/badges/AirQualityBadge", () => ({
  AirQualityBadge: ({ grade }: { grade: string }) => <span>{grade}</span>,
}));

describe("Weather Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseWeather.mockReturnValue({
      location: { id: "default", name: "서울 송파구 잠실동" },
      nowLoading: false,
      airQualityLoading: false,
      isOnline: true,
      now: { tempC: 25, humidityPct: 60, windMs: 2.5, weatherCode: { pty: 0, sky: 1 }, updatedAt: Date.now() },
      airQuality: { pm10: 35, pm25: 20, updatedAt: Date.now() },
      daily: [{ date: "2024-01-01", minC: 20, maxC: 28 }],
    });

    mockUseCurrentWeather.mockReturnValue({
      data: { tempC: 25, humidityPct: 60, windMs: 2.5, weatherCode: { pty: 0, sky: 1 } },
      isLoading: false,
      error: null,
      isStale: false,
      isOnline: true,
      lastUpdated: Date.now(),
    });

    mockUseWeatherFormat.mockReturnValue({
      formatHumidity: (v?: number) => (v == null ? "--" : `${v}%`),
      formatWindSpeed: (v?: number) => (v == null ? "--" : `${v}m/s`),
      formatAirQuality: () => "보통",
      formatTemperature: (v?: number) => (v == null ? "--" : `${v}°`),
    });

    mockUseWeatherIcon.mockReturnValue({
      getIconName: () => "sun",
      getConditionText: () => "맑음",
    });

    mockUseYesterdayTemperatureComparison.mockReturnValue({
      diff: 2,
      isLoading: false,
    });
  });

  it("헤더에서 위치명을 표시해야 함", () => {
    render(<Weather />);
    expect(screen.getByTestId("location-section")).toHaveTextContent("서울 송파구 잠실동");
  });

  it("현재 날씨 카드가 온도/컨디션을 표시해야 함", () => {
    render(<Weather />);
    expect(screen.getByText(/25°/)).toBeInTheDocument();
    expect(screen.getByText(/맑음/)).toBeInTheDocument();
    expect(screen.getByText(/어제보다/)).toBeInTheDocument();
  });

  it("KPI 섹션에서 습도/바람/미세먼지/초미세먼지를 표시해야 함", () => {
    render(<Weather />);
    expect(screen.getByText("습도")).toBeInTheDocument();
    expect(screen.getByText("바람")).toBeInTheDocument();
    expect(screen.getByText("미세먼지")).toBeInTheDocument();
    expect(screen.getByText("초미세먼지")).toBeInTheDocument();
  });

  it("7일 예보 섹션이 표시되어야 함", () => {
    render(<Weather />);
    expect(screen.getByText("7일 예보")).toBeInTheDocument();
    expect(screen.getByTestId("daily-list")).toBeInTheDocument();
  });

  it("페이지에 WeatherWidget이 포함되어야 함", () => {
    render(<Weather />);
    expect(screen.getByTestId("weather-widget")).toBeInTheDocument();
  });
});
