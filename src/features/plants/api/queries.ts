import type { StorageRepository } from "@/lib/storage/StorageRepository";
import { PLANTS_QK } from "@/lib/query/plantsQueryKeys";

export const plantsQueries = {
  list: (storage: StorageRepository, params?: { query?: string }) => ({
    queryKey: PLANTS_QK.list(),
    queryFn: () => storage.listPlants(params),
  }),
  detail: (storage: StorageRepository, plantId: string) => ({
    queryKey: PLANTS_QK.detail(plantId),
    queryFn: () => storage.getPlant(plantId),
  }),
  taskRules: (storage: StorageRepository, plantId?: string) => ({
    queryKey: PLANTS_QK.taskRules(plantId),
    queryFn: () => storage.listTaskRules(plantId),
  }),
  photos: (storage: StorageRepository, plantId: string) => ({
    queryKey: PLANTS_QK.photos(plantId),
    queryFn: () => storage.listPhotos(plantId),
  }),
} as const;
