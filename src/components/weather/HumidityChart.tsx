/**
 * HumidityChart 컴포넌트
 * 습도 전용 차트 (식물 권장 범위 40-60% 표시)
 */

import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import type { WeatherHourlyPoint } from "../../domain/types";

export interface HumidityChartProps {
  points: WeatherHourlyPoint[];
  height?: number;
  showOptimalRange?: boolean;
  optimalMin?: number; // 권장 최소 습도 (기본: 40%)
  optimalMax?: number; // 권장 최대 습도 (기본: 60%)
}

export function HumidityChart({
  points,
  height = 200,
  showOptimalRange = true,
  optimalMin = 40,
  optimalMax = 60,
}: HumidityChartProps) {
  // 24시간 습도 데이터 가공
  const chartData = React.useMemo(
    () =>
      (points || []).slice(0, 24).map((point, index) => {
        const time = new Date(point.time);
        const hour = time.getHours();

        return {
          label: index === 0 ? "지금" : `${hour}시`,
          humidity: Math.round(point.humidityPct ?? 50),
          time: point.time,
          isOptimal: point.humidityPct
            ? point.humidityPct >= optimalMin && point.humidityPct <= optimalMax
            : false,
        };
      }),
    [points, optimalMin, optimalMax]
  );

  // 툴팁 포맷터
  const tooltipFormatter = React.useCallback(
    (value: any, name: string) => {
      if (name === "humidity") {
        const humidity = value as number;
        let status = "적정";
        if (humidity < optimalMin) status = "건조";
        else if (humidity > optimalMax) status = "습함";

        return [`${value}% (${status})`, "습도"];
      }
      return [value, name];
    },
    [optimalMin, optimalMax]
  );

  // X축 틱 포맷터 (2시간 간격으로 표시)
  const xAxisTickFormatter = React.useCallback((value: any, index: number) => {
    return index % 2 === 0 ? value : "";
  }, []);

  // 습도에 따른 색상 결정
  const getHumidityColor = React.useCallback(
    (humidity: number) => {
      if (humidity < optimalMin) return "#f59e0b"; // 낮음: 주황
      if (humidity > optimalMax) return "#3b82f6"; // 높음: 파랑
      return "#10b981"; // 적정: 초록
    },
    [optimalMin, optimalMax]
  );

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

          {/* X축: 시간 레이블 */}
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            interval={0}
            tickFormatter={xAxisTickFormatter}
            axisLine={false}
            tickLine={false}
          />

          {/* Y축: 습도 % */}
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            label={{ value: "습도 (%)", angle: -90, position: "insideLeft" }}
          />

          {/* 권장 범위 영역 표시 */}
          {showOptimalRange && (
            <ReferenceArea
              y1={optimalMin}
              y2={optimalMax}
              fill="#dcfce7"
              fillOpacity={0.3}
              stroke="#10b981"
              strokeDasharray="5 5"
            />
          )}

          {/* 권장 범위 기준선 */}
          {showOptimalRange && (
            <>
              <ReferenceLine
                y={optimalMin}
                stroke="#10b981"
                strokeDasharray="2 2"
                strokeWidth={1}
              />
              <ReferenceLine
                y={optimalMax}
                stroke="#10b981"
                strokeDasharray="2 2"
                strokeWidth={1}
              />
            </>
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

          {/* 습도 선 차트 */}
          <Line
            type="monotone"
            dataKey="humidity"
            stroke="#374151"
            strokeWidth={3}
            dot={(props) => {
              const { cx, cy, payload } = props;
              const color = getHumidityColor(payload.humidity);
              return <circle cx={cx} cy={cy} r={4} fill={color} stroke="#ffffff" strokeWidth={2} />;
            }}
            activeDot={(props) => {
              const { cx, cy, payload } = props;
              const color = getHumidityColor(payload.humidity);
              return <circle cx={cx} cy={cy} r={6} fill={color} stroke="#ffffff" strokeWidth={3} />;
            }}
            name="humidity"
          />

          {/* 권장 범위 채우기 (영역) */}
          {showOptimalRange && (
            <Area
              type="monotone"
              dataKey="humidity"
              stroke="transparent"
              fill="#10b981"
              fillOpacity={0.1}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* 범례 및 권장 범위 안내 */}
      <div className="flex flex-col items-center gap-2 mt-3">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>적정 (40-60%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span>건조 (&lt;40%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>습함 (&gt;60%)</span>
          </div>
        </div>

        {showOptimalRange && (
          <div className="text-xs text-muted-foreground text-center">
            식물에게 가장 적합한 습도 범위: {optimalMin}-{optimalMax}%
          </div>
        )}
      </div>
    </div>
  );
}
