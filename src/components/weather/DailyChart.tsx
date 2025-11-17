/**
 * DailyChart 컴포넌트
 * 7일 일별 날씨 차트 (최고/최저 온도 영역 + 평균 습도 + 강수확률)
 */

import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  CartesianGrid,
} from "recharts";
import { WeatherDailyPoint } from "../../domain/types";

export interface DailyChartProps {
  points: WeatherDailyPoint[];
  showTemperature?: boolean;
  showHumidity?: boolean;
  showPrecipitation?: boolean;
  height?: number;
}

export function DailyChart({
  points,
  showTemperature = true,
  showHumidity = true,
  showPrecipitation = true,
  height = 200,
}: DailyChartProps) {
  // 7일 데이터 가공
  const chartData = React.useMemo(
    () =>
      (points || []).slice(0, 7).map((point) => {
        // 요일 레이블 생성
        const date = new Date(point.date);
        const dayName = date.toLocaleDateString("ko-KR", { weekday: "short" });

        // 평균 습도 계산 (실제로는 일별 시간별 데이터에서 평균을 구해야 하지만,
        // 현재 데이터 구조상에서는 기본값 사용 또는 별도 계산 필요)
        // 여기서는 임시로 50%로 설정 (실제 구현에서는 시간별 데이터에서 계산)
        const avgHumidity = 50; // TODO: 실제 평균 습도 계산 로직 구현 필요

        return {
          label: dayName,
          minTemp: Math.round(point.minC),
          maxTemp: Math.round(point.maxC),
          precip: Math.round(point.precipProbMaxPct ?? 0),
          humidity: avgHumidity,
          date: point.date,
        };
      }),
    [points]
  );

  // 툴팁 포맷터
  const tooltipFormatter = React.useCallback((value: any, name: string) => {
    if (name === "minTemp") return [`${value}°C`, "최저"];
    if (name === "maxTemp") return [`${value}°C`, "최고"];
    if (name === "precip") return [`${value}%`, "강수확률"];
    if (name === "humidity") return [`${value}%`, "습도"];
    return [value, name];
  }, []);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={chartData}
          margin={{
            top: 10,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />

          {/* X축: 요일 레이블 */}
          <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />

          {/* Y축들 */}
          {showTemperature && (
            <YAxis
              yAxisId="temp"
              orientation="left"
              domain={["dataMin-2", "dataMax+2"]}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
          )}

          {showPrecipitation && (
            <YAxis yAxisId="precip" orientation="right" hide domain={[0, 100]} />
          )}

          {/* 툴팁 */}
          <Tooltip
            formatter={tooltipFormatter}
            labelStyle={{ color: "#374151" }}
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />

          {/* 최고/최저 온도 영역 차트 */}
          {showTemperature && (
            <>
              <Area
                yAxisId="temp"
                type="monotone"
                dataKey="maxTemp"
                stackId="temp"
                stroke="#ef4444"
                fill="#fecaca"
                fillOpacity={0.4}
                strokeWidth={2}
                name="maxTemp"
              />
              <Area
                yAxisId="temp"
                type="monotone"
                dataKey="minTemp"
                stackId="temp"
                stroke="#3b82f6"
                fill="#93c5fd"
                fillOpacity={0.6}
                strokeWidth={2}
                name="minTemp"
              />
            </>
          )}

          {/* 평균 습도 선 차트 */}
          {showHumidity && (
            <Area
              yAxisId="temp"
              type="monotone"
              dataKey="humidity"
              stroke="#10b981"
              fill="transparent"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="humidity"
            />
          )}

          {/* 강수확률 막대 차트 */}
          {showPrecipitation && (
            <Bar
              yAxisId="precip"
              dataKey="precip"
              fill="#a78bfa"
              barSize={12}
              radius={[2, 2, 0, 0]}
              name="precip"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* 범례 */}
      <div className="flex justify-center items-center gap-4 mt-3 text-xs text-muted-foreground">
        {showTemperature && (
          <>
            <div className="flex items-center gap-1">
              <div className="w-3 h-1 bg-red-400 rounded"></div>
              <span>최고</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-1 bg-blue-400 rounded"></div>
              <span>최저</span>
            </div>
          </>
        )}
        {showHumidity && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 border-t-2 border-dashed border-green-500"></div>
            <span>습도</span>
          </div>
        )}
        {showPrecipitation && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 bg-purple-400 rounded-sm"></div>
            <span>강수확률</span>
          </div>
        )}
      </div>
    </div>
  );
}
