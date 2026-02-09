export interface WeatherLocation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  nx: number;
  ny: number;
  tmX: number;
  tmY: number;
  timezone: "Asia/Seoul";
  updatedAt?: number;
}

export interface WeatherNow {
  tempC: number;
  humidityPct: number;
  windMs: number;
  precipProbPct?: number;
  weatherCode: { sky?: 1 | 3 | 4; pty?: 0 | 1 | 2 | 3 | 5 | 6 | 7 };
  updatedAt: number;
}

export interface WeatherHourlyPoint {
  time: string;
  tempC: number;
  humidityPct?: number;
  precipProbPct?: number;
  sky?: 1 | 3 | 4;
  pty?: 0 | 1 | 2 | 3 | 5 | 6 | 7;
}

export interface WeatherDailyPoint {
  date: string;
  minC: number;
  maxC: number;
  precipProbMaxPct?: number;
  sky?: 1 | 3 | 4;
  pty?: 0 | 1 | 2 | 3 | 5 | 6 | 7;
  humidityPct?: number;
}

export interface AirQuality {
  pm10: number | null;
  pm25: number | null;
  aqiKorea?: string;
  stationName?: string;
  updatedAt: number;
}

export interface WeatherSummary {
  comfort: "쾌적" | "주의" | "위험";
  diffTempVsYesterday?: number;
  message: string;
}
