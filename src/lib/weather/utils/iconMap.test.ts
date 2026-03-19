/**
 * iconMap 유틸리티 함수 테스트
 */

import { describe, it, expect } from "vitest";
import {
  getWeatherIconName,
  getWeatherConditionText,
  getWeatherIconColor,
  getWeatherBackgroundColor,
} from "./iconMap";

describe("getWeatherIconName", () => {
  it("PTY 우선순위로 아이콘 이름을 반환해야 함", () => {
    // 비 (PTY 1)
    expect(getWeatherIconName(1, 1)).toBe("cloud-rain");
    expect(getWeatherIconName(4, 4)).toBe("cloud-rain"); // PTY 4도 비

    // 비 또는 눈 (PTY 2)
    expect(getWeatherIconName(2, 3)).toBe("cloud-snow"); // PTY 2는 cloud-snow

    // 눈 (PTY 3)
    expect(getWeatherIconName(3, 1)).toBe("cloud-snow");

    // 빗방울/눈날림 (PTY 5, 6, 7)
    expect(getWeatherIconName(5, 1)).toBe("cloud-drizzle");
    expect(getWeatherIconName(6, 1)).toBe("cloud-snow");
    expect(getWeatherIconName(7, 1)).toBe("snowflake");
  });

  it("PTY가 없을 때 SKY 코드로 아이콘 이름을 반환해야 함", () => {
    // 맑음
    expect(getWeatherIconName(undefined, 1)).toBe("sun");
    expect(getWeatherIconName(undefined, 1)).toBe("sun");

    // 구름많음/흐림
    expect(getWeatherIconName(undefined, 3)).toBe("cloud");
    expect(getWeatherIconName(undefined, 4)).toBe("cloud");
  });

  it("PTY와 SKY가 모두 없을 때 기본값을 반환해야 함", () => {
    expect(getWeatherIconName(undefined, undefined)).toBe("sun");
    expect(getWeatherIconName(undefined, undefined)).toBe("sun");
  });
});

describe("getWeatherConditionText", () => {
  it("PTY 우선순위로 날씨 상태 텍스트를 반환해야 함", () => {
    expect(getWeatherConditionText(1, 1)).toBe("비");
    expect(getWeatherConditionText(3, 1)).toBe("눈");
    expect(getWeatherConditionText(4, 1)).toBe("소나기");
    expect(getWeatherConditionText(5, 1)).toBe("빗방울");
    expect(getWeatherConditionText(6, 1)).toBe("빗방울/눈날림");
    expect(getWeatherConditionText(7, 1)).toBe("눈날림");
  });

  it("PTY가 없을 때 SKY 코드로 날씨 상태 텍스트를 반환해야 함", () => {
    expect(getWeatherConditionText(undefined, 1)).toBe("맑음");
    expect(getWeatherConditionText(undefined, 3)).toBe("구름많음");
    expect(getWeatherConditionText(undefined, 4)).toBe("흐림");
  });

  it("PTY와 SKY가 모두 없을 때 기본값을 반환해야 함", () => {
    expect(getWeatherConditionText(undefined, undefined)).toBe("맑음");
  });
});

describe("getWeatherIconColor", () => {
  it("PTY 코드에 따라 적절한 색상을 반환해야 함", () => {
    // 비 관련
    expect(getWeatherIconColor(1)).toBe("text-blue-500");
    expect(getWeatherIconColor(2)).toBe("text-blue-500");
    expect(getWeatherIconColor(4)).toBe("text-blue-500");
    expect(getWeatherIconColor(5)).toBe("text-blue-500");

    // 눈 관련
    expect(getWeatherIconColor(3)).toBe("text-slate-400");
    expect(getWeatherIconColor(6)).toBe("text-slate-400");
    expect(getWeatherIconColor(7)).toBe("text-slate-400");
  });

  it("SKY 코드에 따라 적절한 색상을 반환해야 함", () => {
    // 맑음
    expect(getWeatherIconColor(undefined, 1)).toBe("text-yellow-500");

    // 구름많음/흐림
    expect(getWeatherIconColor(undefined, 3)).toBe("text-gray-500");
    expect(getWeatherIconColor(undefined, 4)).toBe("text-gray-500");
  });

  it("기본값으로 맑음 색상을 반환해야 함", () => {
    expect(getWeatherIconColor(undefined, undefined)).toBe("text-yellow-500");
  });
});

describe("getWeatherBackgroundColor", () => {
  it("PTY 코드에 따라 적절한 배경색을 반환해야 함", () => {
    // 비 관련
    expect(getWeatherBackgroundColor(1)).toBe("bg-blue-50");
    expect(getWeatherBackgroundColor(2)).toBe("bg-blue-50");

    // 눈 관련
    expect(getWeatherBackgroundColor(3)).toBe("bg-slate-50");
    expect(getWeatherBackgroundColor(6)).toBe("bg-slate-50");
  });

  it("SKY 코드에 따라 적절한 배경색을 반환해야 함", () => {
    // 맑음
    expect(getWeatherBackgroundColor(undefined, 1)).toBe("bg-yellow-50");

    // 구름많음/흐림
    expect(getWeatherBackgroundColor(undefined, 3)).toBe("bg-gray-50");
    expect(getWeatherBackgroundColor(undefined, 4)).toBe("bg-gray-50");
  });

  it("기본값으로 맑음 배경색을 반환해야 함", () => {
    expect(getWeatherBackgroundColor(undefined, undefined)).toBe("bg-yellow-50");
  });
});
