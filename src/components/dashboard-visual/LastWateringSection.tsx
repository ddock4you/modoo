/**
 * 마지막 물준 날짜 섹션 컴포넌트
 * 상태: 로딩 중 / 데이터 있음 / 데이터 없음
 */
export interface LastWateringSectionProps {
  isLoading: boolean;
  lastWatering: { daysAgo: number; message: string } | null | undefined;
}

export function LastWateringSection({ isLoading, lastWatering }: LastWateringSectionProps) {
  // 로딩 상태
  if (isLoading) {
    return <div className="h-6" />;
  }

  // 데이터 있음 상태
  if (lastWatering) {
    return (
      <div className="mb-60 w-3/4 text-center px-3 py-2 rounded-xl text-sm text-[#4E4946] font-bold bg-[#FFE9AD]">
        {lastWatering.message}
      </div>
    );
  }

  // 데이터 없음 상태
  return (
    <div className="mb-60 w-3/4 text-center px-4 py-2 rounded-xl text-sm text-[#4E4946] font-bold bg-[#FFE9AD]">
      아직 물을 준 기록이 없습니다.
    </div>
  );
}
