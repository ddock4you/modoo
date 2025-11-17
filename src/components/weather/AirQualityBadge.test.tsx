/**
 * AirQualityBadge 컴포넌트 테스트
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AirQualityBadge } from "./AirQualityBadge";
import type { AirQuality } from "../../domain/types";

describe("AirQualityBadge", () => {
  const mockAirQuality: AirQuality = {
    pm10: 45,
    pm25: 25,
    aqiKorea: "보통",
    stationName: "서울 송파구",
    updatedAt: Date.now(),
  };

  it("대기질 데이터가 없을 때 측정중 상태를 표시해야 함", () => {
    render(<AirQualityBadge airQuality={null} />);

    expect(screen.getByText("측정중")).toBeInTheDocument();
  });

  it("대기질 등급을 올바르게 표시해야 함", () => {
    render(<AirQualityBadge airQuality={mockAirQuality} />);

    expect(screen.getByText("보통")).toBeInTheDocument();
  });

  it("등급별 적절한 이모지를 표시해야 함", () => {
    const { rerender } = render(
      <AirQualityBadge airQuality={{ ...mockAirQuality, aqiKorea: "좋음" }} />
    );
    expect(screen.getByText("😊")).toBeInTheDocument();

    rerender(<AirQualityBadge airQuality={{ ...mockAirQuality, aqiKorea: "보통" }} />);
    expect(screen.getByText("😐")).toBeInTheDocument();

    rerender(<AirQualityBadge airQuality={{ ...mockAirQuality, aqiKorea: "나쁨" }} />);
    expect(screen.getByText("😷")).toBeInTheDocument();

    rerender(<AirQualityBadge airQuality={{ ...mockAirQuality, aqiKorea: "매우나쁨" }} />);
    expect(screen.getByText("🤒")).toBeInTheDocument();
  });

  it("PM10/PM2.5 값을 표시해야 함", () => {
    render(<AirQualityBadge airQuality={mockAirQuality} showValues={true} />);

    expect(screen.getByText("PM10: 45㎍/m³")).toBeInTheDocument();
    expect(screen.getByText("PM2.5: 25㎍/m³")).toBeInTheDocument();
  });

  it("측정소명을 표시해야 함", () => {
    render(<AirQualityBadge airQuality={mockAirQuality} showStation={true} />);

    expect(screen.getByText("서울 송파구")).toBeInTheDocument();
  });

  it("값과 측정소명 표시를 동시에 지원해야 함", () => {
    render(<AirQualityBadge airQuality={mockAirQuality} showValues={true} showStation={true} />);

    expect(screen.getByText("PM10: 45㎍/m³")).toBeInTheDocument();
    expect(screen.getByText("PM2.5: 25㎍/m³")).toBeInTheDocument();
    expect(screen.getByText("서울 송파구")).toBeInTheDocument();
  });

  it("크기 변형을 지원해야 함", () => {
    const { rerender } = render(<AirQualityBadge airQuality={mockAirQuality} size="sm" />);
    expect(screen.getByText("보통").closest("div")).toHaveClass("px-2", "py-1", "text-xs");

    rerender(<AirQualityBadge airQuality={mockAirQuality} size="md" />);
    expect(screen.getByText("보통").closest("div")).toHaveClass("px-3", "py-1.5", "text-sm");

    rerender(<AirQualityBadge airQuality={mockAirQuality} size="lg" />);
    expect(screen.getByText("보통").closest("div")).toHaveClass("px-4", "py-2", "text-base");
  });

  it("등급이 없을 때 기본 이모지를 표시해야 함", () => {
    render(<AirQualityBadge airQuality={{ ...mockAirQuality, aqiKorea: undefined }} />);

    expect(screen.getByText("❓")).toBeInTheDocument();
    expect(screen.getByText("알수없음")).toBeInTheDocument();
  });

  it("PM10 값이 null일 때 해당 값만 표시하지 않아야 함", () => {
    render(<AirQualityBadge airQuality={{ ...mockAirQuality, pm10: null }} showValues={true} />);

    expect(screen.queryByText(/PM10/)).not.toBeInTheDocument();
    expect(screen.getByText("PM2.5: 25㎍/m³")).toBeInTheDocument();
  });

  it("PM2.5 값이 null일 때 해당 값만 표시하지 않아야 함", () => {
    render(<AirQualityBadge airQuality={{ ...mockAirQuality, pm25: null }} showValues={true} />);

    expect(screen.getByText("PM10: 45㎍/m³")).toBeInTheDocument();
    expect(screen.queryByText(/PM2.5/)).not.toBeInTheDocument();
  });

  it("모든 값이 null일 때 값 표시 영역이 나타나지 않아야 함", () => {
    render(
      <AirQualityBadge
        airQuality={{ ...mockAirQuality, pm10: null, pm25: null }}
        showValues={true}
      />
    );

    expect(screen.queryByText(/PM10|PM2.5/)).not.toBeInTheDocument();
  });

  it("측정소명이 없을 때 측정소명 영역이 나타나지 않아야 함", () => {
    render(
      <AirQualityBadge
        airQuality={{ ...mockAirQuality, stationName: undefined }}
        showStation={true}
      />
    );

    expect(screen.queryByText("서울 송파구")).not.toBeInTheDocument();
  });
});
