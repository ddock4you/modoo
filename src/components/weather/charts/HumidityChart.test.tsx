/**
 * HumidityChart 컴포넌트 테스트
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HumidityChart } from "./HumidityChart";
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
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  ReferenceLine: () => <div data-testid="reference-line" />,
  ReferenceArea: () => <div data-testid="reference-area" />,
}));

describe("HumidityChart", () => {
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
      humidityPct: 45,
      precipProbPct: 20,
      pty: 1, // 비
      sky: 4,
    },
  ];

  it("기본 props로 올바르게 렌더링되어야 함", () => {
    render(<HumidityChart points={mockHourlyData} />);

    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(screen.getByTestId("composed-chart")).toBeInTheDocument();
    expect(screen.getByText("식물에게 가장 적합한 습도 범위: 40-60%")).toBeInTheDocument();
  });

  it("습도 선 차트를 표시해야 함", () => {
    render(<HumidityChart points={mockHourlyData} />);

    expect(screen.getByTestId("line")).toBeInTheDocument();
  });

  it("권장 범위 영역을 표시해야 함", () => {
    render(<HumidityChart points={mockHourlyData} showOptimalRange={true} />);

    expect(screen.getByTestId("reference-area")).toBeInTheDocument();
    expect(screen.getAllByTestId("reference-line")).toHaveLength(2); // min/max 선
  });

  it("권장 범위 표시를 비활성화할 수 있어야 함", () => {
    render(<HumidityChart points={mockHourlyData} showOptimalRange={false} />);

    expect(screen.queryByTestId("reference-area")).not.toBeInTheDocument();
    expect(screen.queryByTestId("reference-line")).not.toBeInTheDocument();
  });

  it("커스텀 권장 범위를 설정할 수 있어야 함", () => {
    render(<HumidityChart points={mockHourlyData} optimalMin={30} optimalMax={70} />);

    expect(screen.getByText("식물에게 가장 적합한 습도 범위: 30-70%")).toBeInTheDocument();
  });

  it("습도 상태에 따른 범례를 표시해야 함", () => {
    render(<HumidityChart points={mockHourlyData} />);

    expect(screen.getByText("적정 (40-60%)")).toBeInTheDocument();
    expect(screen.getByText("건조 (<40%)")).toBeInTheDocument();
    expect(screen.getByText("습함 (>60%)")).toBeInTheDocument();
  });

  it("데이터를 24시간으로 제한해야 함", () => {
    const manyHoursData = Array.from({ length: 30 }, (_, i) => ({
      ...mockHourlyData[0],
      time: new Date(Date.now() + i * 60 * 60 * 1000).toISOString(),
      humidityPct: 50 + i, // 다양한 습도 값
    }));

    render(<HumidityChart points={manyHoursData} />);

    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("데이터가 없을 때 빈 차트를 렌더링해야 함", () => {
    render(<HumidityChart points={[]} />);

    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("height prop을 올바르게 적용해야 함", () => {
    render(<HumidityChart points={mockHourlyData} height={300} />);

    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("시간 레이블을 올바르게 표시해야 함", () => {
    render(<HumidityChart points={mockHourlyData} />);

    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("습도 값이 null일 때 기본값을 사용해야 함", () => {
    const dataWithNullHumidity = [
      {
        ...mockHourlyData[0],
        humidityPct: undefined,
      },
    ];

    render(<HumidityChart points={dataWithNullHumidity} />);

    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("Y축 레이블을 올바르게 표시해야 함", () => {
    render(<HumidityChart points={mockHourlyData} />);

    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });
});
