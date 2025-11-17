/**
 * 날씨 아이콘 매핑 유틸리티
 * PTY(강수형태)와 SKY(하늘상태) 코드를 Lucide 아이콘으로 변환
 */

import { LucideIcon } from "lucide-react";

/**
 * PTY 코드별 아이콘 매핑
 * 0: 없음, 1: 비, 2: 비/눈, 3: 눈, 4: 소나기, 5: 빗방울, 6: 빗방울/눈날림, 7: 눈날림
 */
const PTY_ICONS: Record<number, string> = {
  0: "sun", // 없음 - 맑음 아이콘으로 폴백
  1: "cloud-rain", // 비
  2: "cloud-snow", // 비/눈
  3: "cloud-snow", // 눈
  4: "cloud-rain", // 소나기
  5: "cloud-drizzle", // 빗방울
  6: "cloud-snow", // 빗방울/눈날림
  7: "snowflake", // 눈날림
};

/**
 * SKY 코드별 아이콘 매핑
 * 1: 맑음, 3: 구름많음, 4: 흐림
 */
const SKY_ICONS: Record<number, string> = {
  1: "sun", // 맑음
  3: "cloud", // 구름많음
  4: "cloud", // 흐림
};

/**
 * PTY 코드별 날씨 상태 텍스트 매핑
 */
const PTY_CONDITIONS: Record<number, string> = {
  0: "맑음", // 없음
  1: "비",
  2: "비/눈",
  3: "눈",
  4: "소나기",
  5: "빗방울",
  6: "빗방울/눈날림",
  7: "눈날림",
};

/**
 * SKY 코드별 날씨 상태 텍스트 매핑
 */
const SKY_CONDITIONS: Record<number, string> = {
  1: "맑음",
  3: "구름많음",
  4: "흐림",
};

/**
 * PTY/SKY 코드를 기반으로 Lucide 아이콘 이름을 반환
 * 강수(PTY)가 우선순위 높음
 */
export function getWeatherIconName(pty?: number, sky?: number): string {
  // 강수 우선 (PTY)
  if (pty !== undefined && pty !== null && pty !== 0) {
    return PTY_ICONS[pty] || "sun";
  }

  // 맑음/흐림 (SKY)
  if (sky !== undefined && sky !== null) {
    return SKY_ICONS[sky] || "sun";
  }

  return "sun"; // 기본값
}

/**
 * PTY/SKY 코드를 기반으로 날씨 상태 텍스트를 반환
 * 강수(PTY)가 우선순위 높음
 */
export function getWeatherConditionText(pty?: number, sky?: number): string {
  // 강수 우선 (PTY)
  if (pty !== undefined && pty !== null && pty !== 0) {
    return PTY_CONDITIONS[pty] || "맑음";
  }

  // 맑음/흐림 (SKY)
  if (sky !== undefined && sky !== null) {
    return SKY_CONDITIONS[sky] || "맑음";
  }

  return "맑음"; // 기본값
}

/**
 * 날씨 상태별 추천 색상 (Tailwind 클래스)
 */
export function getWeatherIconColor(pty?: number, sky?: number): string {
  // 강수 관련
  if (pty === 1 || pty === 2 || pty === 4 || pty === 5) return "text-blue-500"; // 비
  if (pty === 3 || pty === 6 || pty === 7) return "text-slate-400"; // 눈

  // 맑음/흐림
  if (sky === 1) return "text-yellow-500"; // 맑음
  if (sky === 3 || sky === 4) return "text-gray-500"; // 구름많음/흐림

  return "text-yellow-500"; // 기본값 (맑음)
}

/**
 * 날씨 상태별 배경색 (Tailwind 클래스)
 */
export function getWeatherBackgroundColor(pty?: number, sky?: number): string {
  // 강수 관련
  if (pty === 1 || pty === 2 || pty === 4 || pty === 5) return "bg-blue-50"; // 비
  if (pty === 3 || pty === 6 || pty === 7) return "bg-slate-50"; // 눈

  // 맑음/흐림
  if (sky === 1) return "bg-yellow-50"; // 맑음
  if (sky === 3 || sky === 4) return "bg-gray-50"; // 구름많음/흐림

  return "bg-yellow-50"; // 기본값 (맑음)
}
