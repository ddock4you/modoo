import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStorage } from "@/providers/useStorage";
import type { Plant, TaskRule } from "@/domain/types";
import { ScheduleHeader } from "@/features/plants/components/watering-schedule/ScheduleHeader";
import { ScheduleTimeline } from "@/features/plants/components/watering-schedule/ScheduleTimeline";
import { SchedulePlants } from "@/features/plants/components/watering-schedule/SchedulePlants";
import { plantsQueries } from "@/features/plants/api/queries";

function calculateDayFromToday(targetDate: number, now: number): number | null {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const targetDateStart = new Date(targetDate);
  targetDateStart.setHours(0, 0, 0, 0);

  const diffMs = targetDateStart.getTime() - todayStart.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays >= 1 && diffDays <= 7) {
    return diffDays;
  }

  return null;
}

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
  const activeWaterRules = rules.filter((rule) => rule.type === "water" && rule.active === 1);

  if (activeWaterRules.length === 0) {
    return {
      nextDueDate: null,
      daysUntilNext: 0,
      currentDay: 1,
      plantsByDay: new Map(),
    };
  }

  const plantMap = new Map<string, Plant>();
  plants.forEach((plant) => plantMap.set(plant.id, plant));

  const plantsByDay = new Map<number, Array<{ plant: Plant; rule: TaskRule }>>();
  let nextDueDate: number | null = null;
  let minDaysUntilNext = Infinity;

  activeWaterRules.forEach((rule) => {
    const plant = plantMap.get(rule.plantId);
    if (!plant) return;

    if (rule.nextDueAt > now) {
      const day = calculateDayFromToday(rule.nextDueAt, now);
      if (day !== null) {
        if (!plantsByDay.has(day)) {
          plantsByDay.set(day, []);
        }
        plantsByDay.get(day)!.push({ plant, rule });

        const daysUntil = day;
        if (daysUntil < minDaysUntilNext) {
          minDaysUntilNext = daysUntil;
          nextDueDate = rule.nextDueAt;
        }
      }
    }
  });

  return {
    nextDueDate,
    daysUntilNext: nextDueDate ? minDaysUntilNext : 0,
    currentDay: 1,
    plantsByDay,
  };
}

export function RecommendedWateringSchedule() {
  const storage = useStorage();
  const [selectedDay, setSelectedDay] = useState(1);

  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    ...plantsQueries.taskRules(storage),
  });

  const { data: plants = [], isLoading: plantsLoading } = useQuery({
    ...plantsQueries.list(storage),
  });

  const scheduleData = useMemo(() => {
    const now = Date.now();
    return calculateScheduleData(rules, plants, now);
  }, [rules, plants]);

  const isLoading = rulesLoading || plantsLoading;

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
