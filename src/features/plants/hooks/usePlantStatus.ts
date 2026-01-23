import { useQuery } from "@tanstack/react-query";
import { useStorage } from "@/lib/storage/useStorage";
import type { PlantStatus, PlantStatusInfo, PlantsStatusStats } from "@/domain/types";

export function usePlantStatus(
  plantId: string | undefined,
  options?: {
    refetchInterval?: number;
    enabled?: boolean;
  }
) {
  const storage = useStorage();

  return useQuery({
    queryKey: ["plantStatus", plantId],
    queryFn: async (): Promise<PlantStatusInfo> => {
      if (!plantId) {
        throw new Error("Plant ID is required");
      }
      return storage.getPlantStatus(plantId);
    },
    enabled: !!plantId && options?.enabled !== false,
    refetchInterval: options?.refetchInterval ?? 60000,
  });
}

export function useAllPlantsStatus(options?: { refetchInterval?: number; enabled?: boolean }) {
  const storage = useStorage();

  return useQuery({
    queryKey: ["allPlantsStatus"],
    queryFn: (): Promise<PlantStatusInfo[]> => storage.getAllPlantsStatus(),
    enabled: options?.enabled !== false,
    refetchInterval: options?.refetchInterval ?? 60000,
  });
}

export function usePlantsStatusStats(options?: { refetchInterval?: number; enabled?: boolean }) {
  const storage = useStorage();

  return useQuery({
    queryKey: ["plantsStatusStats"],
    queryFn: (): Promise<PlantsStatusStats> => storage.getPlantsStatusStats(),
    enabled: options?.enabled !== false,
    refetchInterval: options?.refetchInterval ?? 60000,
  });
}

export function getStatusLabel(status: PlantStatus): string {
  switch (status) {
    case "good":
      return "양호";
    case "warning":
      return "주의";
    case "danger":
      return "위험";
    case null:
      return "상태 없음";
    default:
      return "알 수 없음";
  }
}

export function getStatusColorClass(status: PlantStatus): string {
  switch (status) {
    case "good":
      return "text-emerald-600 bg-emerald-500/15";
    case "warning":
      return "text-amber-600 bg-amber-500/15";
    case "danger":
      return "text-rose-600 bg-rose-500/15";
    case null:
      return "text-muted-foreground bg-muted";
    default:
      return "text-muted-foreground bg-muted";
  }
}
