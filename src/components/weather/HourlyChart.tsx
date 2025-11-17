/**
 * HourlyChart 컴포넌트
 * 24시간 시간별 날씨 차트 (온도 + 습도 + 강수확률)
 * 가로 스크롤 지원
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
  Bar,
  CartesianGrid,
  XAxisProps,
} from "recharts";
import { WeatherHourlyPoint } from "../../domain/types";

export interface HourlyChartProps {
  points: WeatherHourlyPoint[];
  showTemperature?: boolean;
  showHumidity?: boolean;
  showPrecipitation?: boolean;
  height?: number;
}

export function HourlyChart({
  points,
  showTemperature = true,
  showHumidity = true,
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

  // 툴팁 포맷터
  const tooltipFormatter = React.useCallback((value: any, name: string) => {
    if (name === "temp") return [`${value}°C`, "온도"];
    if (name === "humidity") return [`${value}%`, "습도"];
    if (name === "precip") return [`${value}%`, "강수확률"];
    return [value, name];
  }, []);

  // X축 틱 포맷터 (2시간 간격으로 표시)
  const xAxisTickFormatter = React.useCallback((value: any, index: number) => {
    return index % 2 === 0 ? value : "";
  }, []);

  return (
    <div className="w-full">
      {/* 가로 스크롤 컨테이너 */}
      <div className="overflow-x-auto pb-2">
        <div style={{ minWidth: "800px", width: "max-content" }}>
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

              {/* Y축들 */}
              {showTemperature && (
                <YAxis yAxisId="temp" orientation="left" hide domain={["dataMin-2", "dataMax+2"]} />
              )}

              {showHumidity && (
                <YAxis yAxisId="humidity" orientation="right" hide domain={[0, 100]} />
              )}

              {showPrecipitation && <YAxis yAxisId="precip" hide domain={[0, 100]} />}

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

              {/* 온도 영역 차트 */}
              {showTemperature && (
                <Area
                  yAxisId="temp"
                  type="monotone"
                  dataKey="temp"
                  stroke="#ef4444"
                  fill="#fecaca"
                  fillOpacity={0.3}
                  strokeWidth={2}
                  name="temp"
                />
              )}

              {/* 습도 선 차트 */}
              {showHumidity && (
                <Line
                  yAxisId="humidity"
                  type="monotone"
                  dataKey="humidity"
                  stroke="#3b82f6"
                  dot={false}
                  strokeWidth={2}
                  name="humidity"
                />
              )}

              {/* 강수확률 막대 차트 */}
              {showPrecipitation && (
                <Bar
                  yAxisId="precip"
                  dataKey="precip"
                  fill="#a78bfa"
                  barSize={6}
                  radius={[2, 2, 0, 0]}
                  name="precip"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 스크롤 인디케이터 */}
      <div className="flex justify-center mt-2">
        <div className="text-xs text-muted-foreground">
          ← 스크롤하여 전체 24시간 데이터를 확인하세요 →
        </div>
      </div>
    </div>
  );
}
