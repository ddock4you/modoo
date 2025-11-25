/**
 * WeatherStatusCard 컴포넌트
 * 상태 카드 (온도/쾌적도/전날 대비)
 */

import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  calculateComfortLevel,
  calculateTemperatureDiff,
  getDateStrings,
} from "@/components/weather/utils";
import { useWeatherSummary } from "@/lib/weather/useWeather";

type UseWeatherSummaryReturn = ReturnType<typeof useWeatherSummary>;

export interface WeatherStatusCardProps {
  currentWeather: {
    data?: { tempC?: number; humidityPct?: number; weatherCode?: { pty?: number; sky?: number } };
  };
  dailyWeather: {
    data?: Array<{ date: string; minC: number; maxC: number }>;
  };
  summary: UseWeatherSummaryReturn;
  getConditionText: (pty?: number, sky?: number) => string;
  formatTemperature: (temp?: number) => string;
}

export function WeatherStatusCard({
  currentWeather,
  dailyWeather,
  summary,
  getConditionText,
  formatTemperature,
}: WeatherStatusCardProps) {
  // 전날 대비 온도 차이 계산
  const { today, yesterday } = getDateStrings();
  const todayDaily = dailyWeather.data?.find((d) => d.date === today);
  const yesterDaily = dailyWeather.data?.find((d) => d.date === yesterday);
  const diffVsYesterday = calculateTemperatureDiff(todayDaily, yesterDaily);

  // 쾌적도 계산
  const tempNow = summary.temperature ?? currentWeather.data?.tempC;
  const humidityNow = summary.humidity ?? currentWeather.data?.humidityPct;
  const { label: comfortLabel, message: comfortMessage } = calculateComfortLevel(
    tempNow,
    humidityNow
  );

  const conditionText = getConditionText(
    currentWeather.data?.weatherCode?.pty,
    currentWeather.data?.weatherCode?.sky
  );

  return (
    <div className="flex gap-3 rounded-lg border bg-muted/30 p-3">
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-lg",
          comfortLabel === "쾌적" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
        )}
      >
        {comfortLabel === "쾌적" ? "🌤️" : "⚠️"}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">
            {formatTemperature(tempNow)} {conditionText}
          </span>
          {diffVsYesterday !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs",
                diffVsYesterday > 0 ? "text-rose-600" : "text-blue-600"
              )}
            >
              {diffVsYesterday > 0 ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              전날보다 {Math.abs(diffVsYesterday)}° {diffVsYesterday > 0 ? "높음" : "낮음"}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{comfortMessage}</p>
      </div>
    </div>
  );
}
