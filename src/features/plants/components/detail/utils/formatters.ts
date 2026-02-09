import type { Plant } from "@/domain/types";

export function formatDateKo(timestampMs: number): string {
  return new Date(timestampMs).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatHumidityRange(humidity: Plant["humidity"]): string {
  if (!humidity) return "정보 없음";
  return `${humidity.min}% - ${humidity.max}%`;
}

export function formatTemperatureRange(temperature: Plant["temperature"]): string {
  if (!temperature) return "정보 없음";
  return `${temperature.min}°C - ${temperature.max}°C`;
}

export function formatLightLevel(lightLevel: Plant["lightLevel"]): string {
  switch (lightLevel) {
    case "low":
      return "약한 빛";
    case "medium":
      return "중간 빛";
    case "high":
      return "강한 빛";
    default:
      return "정보 없음";
  }
}

export function formatNextDueLabel(nextDueAt: number, nowMs: number): string {
  const diffMs = nextDueAt - nowMs;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)}일 지남`;
  if (diffDays === 0) return "오늘";
  return `${diffDays}일 후`;
}
