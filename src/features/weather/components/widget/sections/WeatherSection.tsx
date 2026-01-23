/**
 * WeatherSection 컴포넌트
 * "오늘의 날씨" 섹션 (차트 + 아이콘 리스트)
 */

import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { WeatherHourlyPoint } from "@/domain/types";
import { HourlyChart } from "@/features/weather/components/charts/HourlyChart";
import { WeatherIconList } from "@/features/weather/components/lists/WeatherIconList";

export interface WeatherSectionProps {
  hourlyData: WeatherHourlyPoint[];
  getIconName: (pty?: number, sky?: number) => string;
}

export function WeatherSection({ hourlyData, getIconName }: WeatherSectionProps) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">오늘의 날씨</h3>
        <Link
          to="/weather"
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* 차트와 아이콘 리스트를 하나의 스크롤 컨테이너로 묶기 */}
      {hourlyData.length > 0 && (
        <div
          className="overflow-x-auto pb-2 outline-none focus:outline-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          tabIndex={-1}
        >
          {/* 시간대별 날씨 차트 (24시간) */}
          <div className="mb-3">
            <HourlyChart
              points={hourlyData}
              height={60}
              showTemperature={true}
              showPrecipitation={true}
            />
          </div>

          {/* 시간대별 날씨를 아이콘으로 표시 */}
          <WeatherIconList points={hourlyData} getIconName={getIconName} />
        </div>
      )}
    </div>
  );
}
