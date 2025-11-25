/**
 * HourlyChart 컴포넌트
 * 24시간 시간별 날씨 차트 (온도 + 습도 + 강수확률)
 * 가로 스크롤 지원
 */

import React from "react";
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, Bar } from "recharts";
import type { WeatherHourlyPoint } from "../../domain/types";

export interface HourlyChartProps {
  points: WeatherHourlyPoint[];
  showTemperature?: boolean;
  showPrecipitation?: boolean;
  height?: number;
}

export function HourlyChart({
  points,
  showTemperature = true,
  showPrecipitation = true,
  height = 200,
}: HourlyChartProps) {
  // 24시간 데이터만 사용
  const chartData = React.useMemo(
    () =>
      (points || []).slice(0, 24).map((point, index) => {
        const time = new Date(point.time);
        const hour = time.getHours();

        return {
          label: index === 0 ? "지금" : `${hour}시`,
          temp: Math.round(point.tempC),
          humidity: Math.round(point.humidityPct ?? 0),
          precip: Math.round(point.precipProbPct ?? 0),
          time: point.time,
        };
      }),
    [points]
  );

  return (
    <div className="w-full text-foreground">
      {/* 차트 컨테이너 (스크롤은 부모에서 처리) */}
      <div style={{ minWidth: "1510px", width: "max-content" }} className="outline-none">
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart
            data={chartData}
            margin={{
              top: 0,
              right: 0,
              left: -4,
              bottom: -30,
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

            {/* Y축들 */}
            {showTemperature && (
              <YAxis yAxisId="temp" orientation="left" hide domain={["dataMin-2", "dataMax+2"]} />
            )}

            {showPrecipitation && <YAxis yAxisId="precip" hide domain={[0, 100]} />}

            {/* 온도 영역 차트 */}
            {showTemperature && (
              <Line
                yAxisId="temp"
                type="monotone"
                dataKey="temp"
                stroke="#F5F5F5"
                strokeWidth={1.5}
                dot={{ fill: "#0284C7", r: 4, strokeWidth: 2, stroke: "#ffffff" }}
                activeDot={{ fill: "#0284C7", r: 4, strokeWidth: 2, stroke: "#ffffff" }}
                name="temp"
              />
            )}

            {/* 강수확률 막대 차트 */}
            {showPrecipitation && (
              <Bar
                yAxisId="precip"
                dataKey="precip"
                fill="#a78bfa"
                barSize={5}
                radius={[2, 2, 0, 0]}
                name="precip"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
