export type WeatherBaseTimeType = "now" | "hourly" | "daily" | "airQuality";

export function normalizeBaseTime(baseTimeMs: number, type: WeatherBaseTimeType): number {
  const date = new Date(baseTimeMs);

  switch (type) {
    case "now": {
      // 10-minute buckets (00,10,20,30,40,50)
      const minutes = Math.floor(date.getMinutes() / 10) * 10;
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        minutes,
        0,
        0
      ).getTime();
    }

    case "hourly":
    case "airQuality":
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        0,
        0,
        0
      ).getTime();

    case "daily": {
      // 3-hour buckets (02,05,08,11,14,17,20,23)
      const hour = Math.floor(date.getHours() / 3) * 3;
      const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0, 0, 0);

      // Cache version bump workaround: shift by +1ms to invalidate old daily cache keys.
      return normalized.getTime() + 1;
    }
  }
}

export function getKstNow(): Date {
  const now = new Date();
  const kstOffsetMs = 9 * 60 * 60 * 1000;
  return new Date(now.getTime() + kstOffsetMs);
}

export function getKstYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getYesterdayKstYmd(): string {
  const kstNow = getKstNow();
  const d = new Date(kstNow);
  d.setDate(d.getDate() - 1);
  return getKstYmd(d);
}

// Convert a KST date string (YYYY-MM-DD) to a baseTime epoch that represents
// KST midnight, but stored as UTC epoch ms.
export function kstYmdToMidnightBaseTime(ymd: string): number {
  const [y, m, d] = ymd.split("-").map((x) => Number(x));
  const kstOffsetMs = 9 * 60 * 60 * 1000;
  return Date.UTC(y, m - 1, d, 0, 0, 0, 0) - kstOffsetMs;
}
