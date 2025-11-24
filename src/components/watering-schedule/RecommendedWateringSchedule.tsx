import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStorage } from "../../lib/storage/useStorage";
import type { Plant, TaskRule } from "../../domain/types";
import { ScheduleHeader } from "./ScheduleHeader";
import { ScheduleTimeline } from "./ScheduleTimeline";
import { SchedulePlants } from "./SchedulePlants";

/**
 * 일자 계산 헬퍼 함수
 * 오늘을 기준으로 며칠 후인지 계산 (1-7)
 */
function calculateDayFromToday(targetDate: number, now: number): number | null {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const targetDateStart = new Date(targetDate);
  targetDateStart.setHours(0, 0, 0, 0);

  const diffMs = targetDateStart.getTime() - todayStart.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  // 1일~7일 범위 내에 있는지 확인
  if (diffDays >= 1 && diffDays <= 7) {
    return diffDays;
  }

  return null;
}

/**
 * 일정 데이터 계산
 */
function calculateScheduleData(
  rules: TaskRule[],
  plants: Plant[],
  now: number
): {
  nextDueDate: number | null;
  daysUntilNext: number;
  currentDay: number;
  plantsByDay: Map<number, Array<{ plant: Plant; rule: TaskRule }>>;
} {
  // 활성화된 물주기 규칙만 필터링
  const activeWaterRules = rules.filter((rule) => rule.type === "water" && rule.active === 1);

  if (activeWaterRules.length === 0) {
    return {
      nextDueDate: null,
      daysUntilNext: 0,
      currentDay: 1,
      plantsByDay: new Map(),
    };
  }

  // 식물 ID로 매핑
  const plantMap = new Map<string, Plant>();
  plants.forEach((plant) => plantMap.set(plant.id, plant));

  // 7일 범위 내의 규칙만 필터링 및 그룹화
  const plantsByDay = new Map<number, Array<{ plant: Plant; rule: TaskRule }>>();

  // 가장 가까운 다음 물주기 날짜 찾기
  let nextDueDate: number | null = null;
  let minDaysUntilNext = Infinity;

  activeWaterRules.forEach((rule) => {
    const plant = plantMap.get(rule.plantId);
    if (!plant) return;

    // 아직 오지 않은 날짜만 고려
    if (rule.nextDueAt > now) {
      const day = calculateDayFromToday(rule.nextDueAt, now);
      if (day !== null) {
        // 일자별 그룹화
        if (!plantsByDay.has(day)) {
          plantsByDay.set(day, []);
        }
        plantsByDay.get(day)!.push({ plant, rule });

        // 가장 가까운 날짜 찾기
        const daysUntil = day;
        if (daysUntil < minDaysUntilNext) {
          minDaysUntilNext = daysUntil;
          nextDueDate = rule.nextDueAt;
        }
      }
    }
  });

  // 일자별로 정렬
  const sortedDays = Array.from(plantsByDay.keys()).sort((a, b) => a - b);

  return {
    nextDueDate,
    daysUntilNext: nextDueDate ? minDaysUntilNext : 0,
    currentDay: 1, // 오늘 = 1일
    plantsByDay,
  };
}

export function RecommendedWateringSchedule() {
  const storage = useStorage();
  const [selectedDay, setSelectedDay] = useState(1);

  // 모든 규칙과 식물 조회
  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ["taskRules"],
    queryFn: () => storage.listTaskRules(),
  });

  const { data: plants = [], isLoading: plantsLoading } = useQuery({
    queryKey: ["plants"],
    queryFn: () => storage.listPlants(),
  });

  // 일정 데이터 계산
  const scheduleData = useMemo(() => {
    const now = Date.now();
    return calculateScheduleData(rules, plants, now);
  }, [rules, plants]);

  const isLoading = rulesLoading || plantsLoading;

  // 빈 상태 처리
  if (!isLoading && scheduleData.daysUntilNext === 0 && scheduleData.plantsByDay.size === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <ScheduleHeader daysUntilNext={0} />
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">물주기 일정이 없습니다.</p>
          <p className="text-xs mt-2">식물을 등록하고 물주기 규칙을 설정해보세요!</p>
        </div>
      </div>
    );
  }

  // 선택된 일자의 식물 목록
  const selectedPlants = scheduleData.plantsByDay.get(selectedDay) || [];

  return (
    <div className="bg-neutral-100 rounded-lg p-7">
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#24D17E] mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">일정을 불러오는 중...</p>
        </div>
      ) : (
        <>
          <ScheduleHeader daysUntilNext={scheduleData.daysUntilNext} />
          <ScheduleTimeline
            currentDay={scheduleData.currentDay}
            selectedDay={selectedDay}
            onDaySelect={setSelectedDay}
          />
          <SchedulePlants plants={selectedPlants} />
        </>
      )}
    </div>
  );
}
