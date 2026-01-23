import { calculatePlantStatus } from "@/domain/use-cases/calculatePlantStatus";
import type { Plant, TaskRule } from "@/domain/types";
import type { PlantFilters } from "@/features/plants/types";

export function filterPlants(
  plants: Plant[],
  rules: TaskRule[],
  filters: PlantFilters,
  nowMs: number = Date.now()
): Plant[] {
  let filtered = [...plants];

  // 검색어 필터링
  if (filters.query.trim()) {
    const query = filters.query.toLowerCase();
    filtered = filtered.filter((plant) => plant.name.toLowerCase().includes(query));
  }

  const getStatus = (plant: Plant) => calculatePlantStatus(plant, rules, nowMs).status;

  // 상태 필터링
  if (filters.status) {
    filtered = filtered.filter((plant) => getStatus(plant) === filters.status);
  }

  // 위험 식물만 보기 필터링
  if (filters.dangerOnly) {
    filtered = filtered.filter((plant) => getStatus(plant) === "danger");
  }

  // 정렬
  filtered.sort((a, b) => {
    const aTime = a.createdAt;
    const bTime = b.createdAt;

    if (filters.sort === "createdAt_desc") {
      return bTime - aTime; // 최신순
    } else {
      return aTime - bTime; // 오래된 순
    }
  });

  return filtered;
}

export function getDefaultFilters(): PlantFilters {
  return {
    query: "",
    sort: "createdAt_desc",
    status: null,
    dangerOnly: false,
  };
}
