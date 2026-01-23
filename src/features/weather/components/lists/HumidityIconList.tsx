/**
 * HumidityIconList 컴포넌트
 * 시간대별 습도 아이콘 리스트
 */

import { cn } from "@/lib/utils";
import { getHumidityIcon } from "@/features/weather/utils";
import type { WeatherHourlyPoint } from "@/domain/types";

export interface HumidityIconListProps {
  points: WeatherHourlyPoint[];
}

export function HumidityIconList({ points }: HumidityIconListProps) {
  return (
    <div className="flex gap-2" style={{ minWidth: "800px", width: "max-content" }}>
      {points.slice(0, 24).map((point, i) => {
        const time = new Date(point.time);
        const hour = time.getHours();
        const humidity = point.humidityPct ?? 50;
        const isNow = i === 0;

        return (
          <div
            key={i}
            className="flex flex-col items-center gap-1 px-1 py-1 rounded-lg min-w-[55px]"
          >
            <div className="text-lg">{getHumidityIcon(humidity)}</div>
            <div className="text-xs font-medium">{humidity}%</div>
            <div
              className={cn(
                "text-xs font-medium p-1 px-2 bg-[#FA8500] rounded-xl",
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
