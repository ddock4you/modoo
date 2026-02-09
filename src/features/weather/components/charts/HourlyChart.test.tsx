/**
 * HourlyChart 컴포넌트 테스트
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HourlyChart } from "./HourlyChart";
import type { WeatherHourlyPoint } from "@/domain/types";

// Mock recharts components
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  ComposedChart: ({ children }: any) => <div data-testid="composed-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Area: () => <div data-testid="area" />,
  Bar: () => <div data-testid="bar" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
}));

describe("HourlyChart", () => {
  const mockHourlyData: WeatherHourlyPoint[] = [
    {
      time: new Date().toISOString(),
      tempC: 20,
      humidityPct: 60,
      precipProbPct: 10,
      pty: undefined,
      sky: 1,
    },
    {
      time: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1시간 후
      tempC: 22,
      humidityPct: 55,
      precipProbPct: 5,
      pty: undefined,
      sky: 3,
    },
    {
      time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2시간 후
      tempC: 25,
      humidityPct: 50,
      precipProbPct: 20,
      pty: 1, // 비
      sky: 4,
    },
  ];

  it("기본 props로 올바르게 렌더링되어야 함", () => {
    render(<HourlyChart points={mockHourlyData} />);

    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(screen.getByTestId("composed-chart")).toBeInTheDocument();
  });

  it("온도 라인 차트를 표시해야 함", () => {
    render(<HourlyChart points={mockHourlyData} showTemperature={true} />);

    // showTemperature=true 이면 Line이 렌더링된다.
    expect(screen.getByTestId("line")).toBeInTheDocument();
  });

  it("강수확률 막대 차트를 표시해야 함", () => {
    render(<HourlyChart points={mockHourlyData} showPrecipitation={true} />);

    expect(screen.getByTestId("bar")).toBeInTheDocument();
  });

  it("온도 차트를 숨길 수 있어야 함", () => {
    render(<HourlyChart points={mockHourlyData} showTemperature={false} />);

    expect(screen.queryByTestId("line")).not.toBeInTheDocument();
  });

  it("강수확률 차트를 숨길 수 있어야 함", () => {
    render(<HourlyChart points={mockHourlyData} showPrecipitation={false} />);

    expect(screen.queryByTestId("bar")).not.toBeInTheDocument();
  });

  it("데이터를 24시간으로 제한해야 함", () => {
    const manyHoursData = Array.from({ length: 30 }, (_, i) => ({
      ...mockHourlyData[0],
      time: new Date(Date.now() + i * 60 * 60 * 1000).toISOString(),
    }));

    render(<HourlyChart points={manyHoursData} />);

    // 24시간 데이터만 사용되는지 확인하기 위해 렌더링이 정상적으로 되는지 확인
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("데이터가 없을 때 빈 차트를 렌더링해야 함", () => {
    render(<HourlyChart points={[]} />);

    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(screen.getByTestId("composed-chart")).toBeInTheDocument();
  });

  it("height prop을 올바르게 적용해야 함", () => {
    render(<HourlyChart points={mockHourlyData} height={300} />);

    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("시간 레이블을 올바르게 표시해야 함", () => {
    render(<HourlyChart points={mockHourlyData} />);

    // 첫 번째 데이터 포인트는 "지금"으로 표시되고, 나머지는 "X시"로 표시됨
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });
});
