/**
 * WeatherSuccessState 컴포넌트
 * 날씨 위젯 성공 상태 UI (데이터 표시)
 */

import type { WeatherHourlyPoint } from "@/domain/types";
import { useWeatherSummary } from "@/features/weather/hooks/useWeather";

type UseWeatherSummaryReturn = ReturnType<typeof useWeatherSummary>;
import { WeatherSection } from "../sections/WeatherSection";
import { HumiditySection } from "../sections/HumiditySection";
import { WeatherStatusCard } from "../sections/WeatherStatusCard";

export interface WeatherSuccessStateProps {
  hourlyData: WeatherHourlyPoint[];
  currentWeather: {
    data?: { tempC?: number; humidityPct?: number; weatherCode?: { pty?: number; sky?: number } };
  };
  dailyWeather: { data?: Array<{ date: string; minC: number; maxC: number }> };
  summary: UseWeatherSummaryReturn;
  getIconName: (pty?: number, sky?: number) => string;
  getConditionText: (pty?: number, sky?: number) => string;
  formatTemperature: (temp?: number) => string;
}

export function WeatherSuccessState({
  hourlyData,
  currentWeather,
  dailyWeather,
  summary,
  getIconName,
  getConditionText,
  formatTemperature,
}: WeatherSuccessStateProps) {
  return (
    <div className="bg-card text-card-foreground rounded-lg p-4 border">
      <WeatherSection hourlyData={hourlyData} getIconName={getIconName} />
      <HumiditySection hourlyData={hourlyData} />
      <WeatherStatusCard
        currentWeather={currentWeather}
        dailyWeather={dailyWeather}
        summary={summary}
        getConditionText={getConditionText}
        formatTemperature={formatTemperature}
      />
    </div>
  );
}
