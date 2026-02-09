import type { WeatherDailyPoint, WeatherHourlyPoint } from "@/domain/weather/types";

export interface WeatherChartData {
  hourly24h: WeatherHourlyPoint[];
  daily7d: WeatherDailyPoint[];
}
