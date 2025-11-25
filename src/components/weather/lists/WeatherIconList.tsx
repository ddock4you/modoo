/**
 * WeatherIconList 컴포넌트
 * 시간대별 날씨 아이콘 리스트
 */

import { cn } from "../../../lib/utils";
import { getWeatherEmoji } from "../utils";
import type { WeatherHourlyPoint } from "../../../domain/types";

export interface WeatherIconListProps {
  points: WeatherHourlyPoint[];
  getIconName: (pty?: number, sky?: number) => string;
}

export function WeatherIconList({ points, getIconName }: WeatherIconListProps) {
  return (
    <div className="flex gap-2" style={{ minWidth: "800px", width: "max-content" }}>
      {points.slice(0, 24).map((point, i) => {
        const time = new Date(point.time);
        const hour = time.getHours();
        const iconName = getIconName(point.pty, point.sky);
        const temp = Math.round(point.tempC);
        const precip = Math.round(point.precipProbPct ?? 0);
        const isNow = i === 0;

        return (
          <div
            key={i}
            className="flex flex-col items-center gap-1 px-1 py-1 rounded-lg min-w-[55px]"
          >
            <div className="text-lg h-6">{getWeatherEmoji(iconName)}</div>
            <div className="text-xs font-medium">{temp}°</div>
            <div className={cn("text-xs", precip > 0 ? "text-sky-500" : "text-muted-foreground")}>
              {precip}%
            </div>
            <div
              className={cn(
                "text-xs font-medium p-1 px-2 bg-sky-500 rounded-xl",
                isNow ? "text-white" : "text-neutral-600 bg-transparent"
              )}
            >
              {isNow ? "지금" : `${hour}시`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
