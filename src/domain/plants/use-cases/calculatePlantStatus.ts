import type { Plant, PlantStatus, PlantStatusInfo, PlantsStatusStats, TaskRule } from "../types";

/**
 * 밀리초를 일 단위로 변환
 */
function msToDays(ms: number): number {
  return ms / (24 * 60 * 60 * 1000);
}

/**
 * 단일 식물의 상태를 계산합니다.
 *
 * 상태 정의:
 * - good: 물 주기가 다가오기 전에 물을 줬을 때 (nextDueAt > now)
 * - warning: 물을 줘야하는 날이 지난지 이틀째까지 (0일 ~ 2일 지남)
 * - danger: 물을 줘야하는 날이 지난지 삼일째 이후 (3일 이상 지남)
 * - null: TaskRule이 없거나 비활성화된 경우
 *
 * @param plant - 상태를 계산할 식물
 * @param rules - 해당 식물의 TaskRule 배열 (활성화된 물주기 규칙만 전달 권장)
 * @param now - 현재 시간 (밀리초, 기본값: Date.now())
 * @returns 식물 상태 정보
 */
export function calculatePlantStatus(
  plant: Plant,
  rules: TaskRule[],
  now: number = Date.now()
): PlantStatusInfo {
  // 활성화된 물주기 규칙만 필터링
  const activeWaterRules = rules.filter(
    (rule) => rule.plantId === plant.id && rule.type === "water" && rule.active === 1
  );

  // 규칙이 없으면 상태 없음
  if (activeWaterRules.length === 0) {
    return {
      plant,
      status: null,
      rule: null,
    };
  }

  // 여러 규칙이 있는 경우, 가장 긴급한 규칙 선택 (nextDueAt이 가장 빠른 것)
  const urgentRule = activeWaterRules.reduce((prev, current) =>
    current.nextDueAt < prev.nextDueAt ? current : prev
  );

  // 지연 일수 계산 (음수면 아직 안 왔음)
  const daysOverdue = msToDays(now - urgentRule.nextDueAt);

  let status: PlantStatus;
  if (daysOverdue < 0) {
    // 아직 물 줄 날이 안 왔음 → 양호
    status = "good";
  } else if (daysOverdue <= 2) {
    // 0일 ~ 2일 지남 → 주의
    status = "warning";
  } else {
    // 3일 이상 지남 → 위험
    status = "danger";
  }

  return {
    plant,
    status,
    rule: urgentRule,
    daysOverdue: daysOverdue >= 0 ? Math.floor(daysOverdue) : undefined,
  };
}

/**
 * 여러 식물의 상태를 일괄 계산합니다.
 *
 * @param plants - 상태를 계산할 식물 배열
 * @param rules - 모든 TaskRule 배열 (식물별로 필터링됨)
 * @param now - 현재 시간 (밀리초, 기본값: Date.now())
 * @returns 식물 상태 정보 배열
 */
export function calculateAllPlantsStatus(
  plants: Plant[],
  rules: TaskRule[],
  now: number = Date.now()
): PlantStatusInfo[] {
  const rulesByPlantId = new Map<string, TaskRule[]>();
  for (const rule of rules) {
    const list = rulesByPlantId.get(rule.plantId);
    if (list) {
      list.push(rule);
    } else {
      rulesByPlantId.set(rule.plantId, [rule]);
    }
  }

  return plants.map((plant) => {
    const plantRules = rulesByPlantId.get(plant.id) ?? [];
    return calculatePlantStatus(plant, plantRules, now);
  });
}

/**
 * 전체 식물 상태 통계를 계산합니다.
 *
 * @param statusInfos - 식물 상태 정보 배열
 * @returns 상태 통계
 */
export function calculatePlantsStatusStats(statusInfos: PlantStatusInfo[]): PlantsStatusStats {
  const total = statusInfos.length;
  let good = 0;
  let warning = 0;
  let danger = 0;
  let noStatus = 0;

  for (const info of statusInfos) {
    if (info.status === "good") good++;
    else if (info.status === "warning") warning++;
    else if (info.status === "danger") danger++;
    else noStatus++;
  }

  const goodPercentage = total > 0 ? Math.round((good / total) * 100) : 0;

  return {
    total,
    good,
    warning,
    danger,
    noStatus,
    goodPercentage,
  };
}
