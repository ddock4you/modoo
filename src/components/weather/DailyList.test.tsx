/**
 * DailyList 컴포넌트 테스트
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DailyList } from "./DailyList";
import type { WeatherDailyPoint } from "../../domain/types";

// Mock all possible Lucide icons used in the component
vi.mock("lucide-react", () => {
  const mockIcon = (testId: string, emoji: string) => () => <div data-testid={testId}>{emoji}</div>;

  return {
    Sun: mockIcon("sun-icon", "☀️"),
    Cloud: mockIcon("cloud-icon", "☁️"),
    CloudRain: mockIcon("cloud-rain-icon", "🌧️"),
    CloudSnow: mockIcon("cloud-snow-icon", "❄️"),
    CloudDrizzle: mockIcon("cloud-drizzle-icon", "🌦️"),
    Snowflake: mockIcon("snowflake-icon", "❄️"),
  };
});

// Mock iconMap
vi.mock("../../lib/weather/iconMap", () => ({
  getWeatherIconName: vi.fn((pty, sky) => {
    if (pty === 1) return "cloud-rain";
    if (sky === 1) return "sun";
    return "cloud";
  }),
  getWeatherConditionText: vi.fn((pty, sky) => {
    if (pty === 1) return "비";
    if (sky === 1) return "맑음";
    return "구름많음";
  }),
  getWeatherIconColor: vi.fn(() => "text-yellow-500"),
}));

describe("DailyList", () => {
  const mockDailyData: WeatherDailyPoint[] = [
    {
      date: Date.now(), // 오늘
      minC: 15,
      maxC: 25,
      pty: undefined,
      sky: 1, // 맑음
      precipProbMaxPct: 10,
      humidityPct: 60,
    },
    {
      date: Date.now() + 24 * 60 * 60 * 1000, // 내일
      minC: 12,
      maxC: 22,
      pty: 1, // 비
      sky: 3,
      precipProbMaxPct: 80,
      humidityPct: 70,
    },
    {
      date: Date.now() + 2 * 24 * 60 * 60 * 1000, // 모레
      minC: 18,
      maxC: 28,
      pty: undefined,
      sky: 3, // 구름많음
      precipProbMaxPct: 30,
      humidityPct: 50,
    },
  ];

  it("데이터가 없을 때 빈 상태를 표시해야 함", () => {
    render(<DailyList points={[]} />);

    expect(screen.getByText("주간 예보 데이터를 불러올 수 없습니다.")).toBeInTheDocument();
  });

  it("주간 예보 데이터를 올바르게 렌더링해야 함", () => {
    render(<DailyList points={mockDailyData} />);

    // 요일 표시 확인
    expect(screen.getByText("오늘")).toBeInTheDocument();
    expect(screen.getByText("내일")).toBeInTheDocument();
    // 요일이 제대로 표시되는지 확인 (정확한 요일은 날짜에 따라 다르므로 텍스트 존재 여부만 확인)
    const dayElements = screen.getAllByText(/월|화|수|목|금|토|일/);
    expect(dayElements.length).toBeGreaterThan(0);

    // 온도 표시 확인
    expect(screen.getByText("25°")).toBeInTheDocument(); // 오늘 최고
    expect(screen.getByText("15°")).toBeInTheDocument(); // 오늘 최저
    expect(screen.getByText("22°")).toBeInTheDocument(); // 내일 최고
    expect(screen.getByText("12°")).toBeInTheDocument(); // 내일 최저
  });

  it("강수확률을 표시해야 함", () => {
    render(<DailyList points={mockDailyData} showPrecipitation={true} />);

    expect(screen.getByText("10%")).toBeInTheDocument(); // 오늘
    expect(screen.getByText("80%")).toBeInTheDocument(); // 내일
    expect(screen.getByText("30%")).toBeInTheDocument(); // 모레
  });

  it("강수확률 표시를 비활성화할 수 있어야 함", () => {
    render(<DailyList points={mockDailyData} showPrecipitation={false} />);

    // 강수확률이 표시되지 않아야 함
    expect(screen.queryByText("10%")).not.toBeInTheDocument();
    expect(screen.queryByText("80%")).not.toBeInTheDocument();
    expect(screen.queryByText("30%")).not.toBeInTheDocument();
  });

  it("습도를 표시해야 함", () => {
    render(<DailyList points={mockDailyData} showHumidity={true} />);

    expect(screen.getByText("60%")).toBeInTheDocument(); // 오늘
    expect(screen.getByText("70%")).toBeInTheDocument(); // 내일
    expect(screen.getByText("50%")).toBeInTheDocument(); // 모레
  });

  it("습도 표시를 비활성화할 수 있어야 함", () => {
    render(<DailyList points={mockDailyData} showHumidity={false} />);

    // 습도가 표시되지 않아야 함
    expect(screen.queryByText("60%")).not.toBeInTheDocument();
    expect(screen.queryByText("70%")).not.toBeInTheDocument();
    expect(screen.queryByText("50%")).not.toBeInTheDocument();
  });

  it("날씨 아이콘과 상태 텍스트를 표시해야 함", () => {
    render(<DailyList points={mockDailyData} />);

    // 아이콘이 렌더링되는지 확인
    expect(screen.getByTestId("sun-icon")).toBeInTheDocument();
    expect(screen.getByTestId("cloud-rain-icon")).toBeInTheDocument();

    // 날씨 상태 텍스트 확인
    expect(screen.getByText("맑음")).toBeInTheDocument();
    expect(screen.getByText("비")).toBeInTheDocument();
    expect(screen.getByText("구름많음")).toBeInTheDocument();
  });

  it("오늘 항목에 특별한 스타일을 적용해야 함", () => {
    render(<DailyList points={mockDailyData} />);

    // 오늘 항목에 파란색 배경 클래스가 적용되는지 확인
    // "오늘" 텍스트를 포함하는 가장 가까운 컨테이너 div 찾기
    const todayText = screen.getByText("오늘");
    let container = todayText.parentElement;
    while (container && !container.classList.contains("bg-blue-50")) {
      container = container.parentElement;
    }
    expect(container).toHaveClass("bg-blue-50");
    expect(container).toHaveClass("border-blue-200");
  });

  it("maxItems 속성으로 표시할 아이템 수를 제한해야 함", () => {
    render(<DailyList points={mockDailyData} maxItems={2} />);

    expect(screen.getByText("오늘")).toBeInTheDocument();
    expect(screen.getByText("내일")).toBeInTheDocument();

    // 3번째 항목(모레)은 표시되지 않아야 함
    // maxItems=2이면 아이템이 2개만 렌더링되어야 함
    const weatherItems = document.querySelectorAll('[class*="bg-blue-50"], [class*="bg-white"]');
    expect(weatherItems.length).toBe(2); // 오늘(파란색), 내일(흰색) 2개만 있어야 함
  });

  it("기본적으로 최대 7개 아이템을 표시해야 함", () => {
    const manyItems = Array.from({ length: 10 }, (_, i) => ({
      ...mockDailyData[0],
      date: Date.now() + i * 24 * 60 * 60 * 1000,
    }));

    render(<DailyList points={manyItems} />);

    // 7개만 표시되는지 확인 (구체적인 텍스트로는 확인하기 어려우므로 아이템 개수로 간접 확인)
    const items = screen.getAllByText(/\d+°/); // 온도 표시로 아이템 수 확인
    expect(items.length).toBeLessThanOrEqual(14); // 각 아이템당 최고/최저 2개씩
  });
});
