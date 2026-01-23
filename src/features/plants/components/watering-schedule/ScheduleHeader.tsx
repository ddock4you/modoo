import { SymbolTriangle } from "../../../../components/icons";

interface ScheduleHeaderProps {
  daysUntilNext: number;
}

export function ScheduleHeader({ daysUntilNext }: ScheduleHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div className="flex-1">
        <p className="text-sm text-neutral-500 mb-2 font-bold">추천 물주기 일정</p>
        <h3 className="text-lg font-bold text-neutral-900">
          다음 물주기까지 <span className="text-[#22875F]">{daysUntilNext}일</span> 남았습니다.
        </h3>
      </div>
      <div className="shrink-0">
        <SymbolTriangle size={40} />
      </div>
    </div>
  );
}
