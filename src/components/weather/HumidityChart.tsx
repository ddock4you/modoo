/**
 * HumidityChart 컴포넌트
 * 습도 전용 차트 (식물 권장 범위 40-60% 표시)
 */

import React from "react";
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis } from "recharts";
import type { WeatherHourlyPoint } from "../../domain/types";

export interface HumidityChartProps {
  points: WeatherHourlyPoint[];
  height?: number;
}

export function HumidityChart({ points, height = 200 }: HumidityChartProps) {
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
        };
      }),
    [points]
  );

  return (
    <div className="w-full text-foreground">
      {/* 차트 컨테이너 (스크롤은 부모에서 처리) */}
      <div style={{ minWidth: "1487px", width: "max-content" }} className="outline-none">
        <ResponsiveContainer width="100%" height={height} className="outline-none">
          <ComposedChart
            data={chartData}
            margin={{
              top: 10,
              right: 10,
              left: 25,
              bottom: -20,
            }}
          >
            {/* <CartesianGrid strokeDasharray="3 3" opacity={0.3} /> */}

            {/* X축: 시간 레이블 */}
            <XAxis
              dataKey="label"
              tick={false}
              interval={0}
              tickFormatter={() => ""}
              axisLine={false}
              tickLine={false}
            />

            {/* Y축: 습도 % */}
            <YAxis yAxisId="humidity" orientation="left" hide domain={["dataMin-2", "dataMax+2"]} />

            {/* 습도 선 차트 */}
            <Line
              yAxisId="humidity"
              type="monotone"
              dataKey="humidity"
              stroke="#F5F5F5"
              strokeWidth={1.5}
              dot={{ fill: "#C2410C", r: 4, strokeWidth: 2, stroke: "#ffffff" }}
              activeDot={{ fill: "#C2410C", r: 4, strokeWidth: 2, stroke: "#ffffff" }}
              name="humidity"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
