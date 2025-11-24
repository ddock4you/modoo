import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { SymbolGreen } from "../icons/SymbolGreen";

/**
 * 도넛 차트 섹션 컴포넌트
 * 상태: 로딩 중 / 데이터 있음 / 데이터 없음
 */
export interface DonutChartSectionProps {
  isLoading: boolean;
  chartData: Array<{ name: string; value: number; color: string }>;
  statusLabel: string;
}

export function DonutChartSection({ isLoading, chartData, statusLabel }: DonutChartSectionProps) {
  // 로딩 상태
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#24D17E]" />
      </div>
    );
  }

  // 데이터 있음 상태
  if (chartData.length > 0) {
    return (
      <>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={75}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
              cornerRadius={0}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* 중앙 아이콘 및 상태 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <SymbolGreen size={36} color="#24D17E" className="mb-2" />
          <div
            className="px-4 py-1.5 rounded-full text-sm font-semibold"
            style={{ backgroundColor: "#E8F5E9", color: "#24D17E" }}
          >
            {statusLabel}
          </div>
        </div>
      </>
    );
  }

  // 데이터 없음 상태
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <SymbolGreen size={36} color="#9CA3AF" className="mb-2" />
      <div
        className="px-4 py-1.5 rounded-full text-sm font-semibold"
        style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}
      >
        상태 없음
      </div>
    </div>
  );
}
