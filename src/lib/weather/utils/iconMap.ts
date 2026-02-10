/**
 * Weather icon/text mapping utilities
 */

const PTY_ICONS: Record<number, string> = {
  0: "sun",
  1: "cloud-rain",
  2: "cloud-snow",
  3: "cloud-snow",
  4: "cloud-rain",
  5: "cloud-drizzle",
  6: "cloud-snow",
  7: "snowflake",
};

const SKY_ICONS: Record<number, string> = {
  1: "sun",
  3: "cloud",
  4: "cloud",
};

const PTY_CONDITIONS: Record<number, string> = {
  0: "맑음",
  1: "비",
  2: "비/눈",
  3: "눈",
  4: "소나기",
  5: "빗방울",
  6: "빗방울/눈날림",
  7: "눈날림",
};

const SKY_CONDITIONS: Record<number, string> = {
  1: "맑음",
  3: "구름많음",
  4: "흐림",
};

export function getWeatherIconName(pty?: number, sky?: number): string {
  if (pty !== undefined && pty !== null && pty !== 0) {
    return PTY_ICONS[pty] || "sun";
  }

  if (sky !== undefined && sky !== null) {
    return SKY_ICONS[sky] || "sun";
  }

  return "sun";
}

export function getWeatherConditionText(pty?: number, sky?: number): string {
  if (pty !== undefined && pty !== null && pty !== 0) {
    return PTY_CONDITIONS[pty] || "맑음";
  }

  if (sky !== undefined && sky !== null) {
    return SKY_CONDITIONS[sky] || "맑음";
  }

  return "맑음";
}

export function getWeatherIconColor(pty?: number, sky?: number): string {
  if (pty === 1 || pty === 2 || pty === 4 || pty === 5) return "text-blue-500";
  if (pty === 3 || pty === 6 || pty === 7) return "text-slate-400";

  if (sky === 1) return "text-yellow-500";
  if (sky === 3 || sky === 4) return "text-gray-500";

  return "text-yellow-500";
}

export function getWeatherBackgroundColor(pty?: number, sky?: number): string {
  if (pty === 1 || pty === 2 || pty === 4 || pty === 5) return "bg-blue-50";
  if (pty === 3 || pty === 6 || pty === 7) return "bg-slate-50";

  if (sky === 1) return "bg-yellow-50";
  if (sky === 3 || sky === 4) return "bg-gray-50";

  return "bg-yellow-50";
}
