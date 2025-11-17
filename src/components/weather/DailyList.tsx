/**
 * DailyList 컴포넌트
 * 주간 예보를 텍스트 기반 리스트로 표시
 */

import React from "react";
import { WeatherDailyPoint } from "../../domain/types";
import { getWeatherIconName, getWeatherConditionText, getWeatherIconColor } from "../../lib/weather/iconMap";
import * as Icons from "lucide-react";

export interface DailyListProps {
  points: WeatherDailyPoint[];
  maxItems?: number; // 표시할 최대 아이템 수 (기본: 7)
  showPrecipitation?: boolean;
  showHumidity?: boolean;
}

export function DailyList({
  points,
  maxItems = 7,
  showPrecipitation = true,
  showHumidity = false,
}: DailyListProps) {
  // 데이터 가공
  const dailyItems = React.useMemo(
    () =>
      (points || []).slice(0, maxItems).map((point) => {
        const date = new Date(point.date);
        const isToday = new Date().toDateString() === date.toDateString();
        const isTomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString() === date.toDateString();

        // 요일 표시
        let dayLabel = date.toLocaleDateString("ko-KR", { weekday: "short" });
        if (isToday) dayLabel = "오늘";
        else if (isTomorrow) dayLabel = "내일";

        // 날짜 표시용 문자열 (월/일 형식, 모든 날짜에 표시)
        const dateLabel = date.toLocaleDateString("ko-KR", {
          month: "short",
          day: "numeric"
        });

        // 날씨 아이콘과 텍스트
        const iconName = getWeatherIconName(point.pty, point.sky);
        const conditionText = getWeatherConditionText(point.pty, point.sky);
        const iconColor = getWeatherIconColor(point.pty, point.sky);

        // 아이콘 컴포넌트 매핑 (camelCase로 변환)
        const iconKeyMap: Record<string, any> = {
          "sun": Icons.Sun,
          "cloud": Icons.Cloud,
          "cloud-rain": Icons.CloudRain,
          "cloud-snow": Icons.CloudSnow,
          "cloud-drizzle": Icons.CloudDrizzle,
          "snowflake": Icons.Snowflake,
        };
        const IconComponent = iconKeyMap[iconName] || Icons.Sun;

        return {
          date: point.date,
          dayLabel,
          dateLabel,
          isToday,
          isTomorrow,
          iconName,
          conditionText,
          iconColor,
          IconComponent,
          minTemp: Math.round(point.minC),
          maxTemp: Math.round(point.maxC),
          precipProb: Math.round(point.precipProbMaxPct ?? 0),
          humidity: point.humidityPct ? Math.round(point.humidityPct) : undefined,
        };
      }),
    [points, maxItems]
  );

  if (!dailyItems.length) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>주간 예보 데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {dailyItems.map((item, index) => (
        <div
          key={item.date}
          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
            item.isToday
              ? "bg-blue-50 border-blue-200"
              : "bg-white border-gray-200 hover:bg-gray-50"
          }`}
        >
          {/* 날짜 및 요일 */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-12">
              <div className={`text-sm font-medium ${
                item.isToday ? "text-blue-700" : "text-gray-700"
              }`}>
                {item.dayLabel}
              </div>
              {item.dateLabel && (
                <div className="text-xs text-gray-500 mt-0.5">
                  {item.dateLabel}
                </div>
              )}
            </div>

            {/* 날씨 아이콘과 상태 */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <item.IconComponent
                className={`w-5 h-5 flex-shrink-0 ${item.iconColor}`}
              />
              <span className="text-sm text-gray-600 truncate">
                {item.conditionText}
              </span>
            </div>
          </div>

          {/* 온도 및 추가 정보 */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* 최고/최저 온도 */}
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {item.maxTemp}°
              </div>
              <div className="text-xs text-gray-500">
                {item.minTemp}°
              </div>
            </div>

            {/* 강수확률 */}
            {showPrecipitation && (
              <div className="text-right w-12">
                <div className="text-xs text-gray-500">강수</div>
                <div className={`text-sm font-medium ${
                  item.precipProb > 50 ? "text-blue-600" : "text-gray-600"
                }`}>
                  {item.precipProb}%
                </div>
              </div>
            )}

            {/* 습도 */}
            {showHumidity && item.humidity !== undefined && (
              <div className="text-right w-12">
                <div className="text-xs text-gray-500">습도</div>
                <div className="text-sm font-medium text-gray-600">
                  {item.humidity}%
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
