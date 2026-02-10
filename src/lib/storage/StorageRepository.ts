import type {
  Plant,
  PlantStatusInfo,
  PlantsStatusStats,
  TaskEvent,
  TaskRule,
  PhotoMeta,
} from "@/domain/types";

export interface StorageRepository {
  // Plants
  listPlants(params?: { query?: string }): Promise<Plant[]>;
  getPlant(id: string): Promise<Plant | undefined>;
  upsertPlant(plant: Plant): Promise<void>;
  deletePlant(id: string): Promise<void>;

  // Task Rules
  listTaskRules(plantId?: string): Promise<TaskRule[]>;
  upsertTaskRule(rule: TaskRule): Promise<void>;
  deleteTaskRule(id: string): Promise<void>;

  // Task Events
  listTaskEvents(plantId?: string, type?: "water"): Promise<TaskEvent[]>;
  logTaskEvent(event: TaskEvent): Promise<void>;
  /**
   * 백업/복원 등 관리 목적의 upsert
   * (기존 id가 있으면 덮어쓰기)
   */
  upsertTaskEvent(event: TaskEvent): Promise<void>;

  // Photos
  listPhotos(plantId?: string): Promise<PhotoMeta[]>;
  getPhoto(id: string): Promise<PhotoMeta | undefined>;
  upsertPhoto(photo: PhotoMeta): Promise<void>;
  deletePhoto(id: string): Promise<void>;

  // Queries
  getDueTasks(nowMs: number): Promise<Array<{ plant: Plant; rule: TaskRule }>>;

  // Plant Status
  getPlantStatus(plantId: string, nowMs?: number): Promise<PlantStatusInfo>;
  getAllPlantsStatus(nowMs?: number): Promise<PlantStatusInfo[]>;
  getPlantsStatusStats(nowMs?: number): Promise<PlantsStatusStats>;

  /**
   * 백업 복원(overwrite)용 전체 데이터 삭제
   * - 도메인 데이터 스토어를 모두 비웁니다.
   */
  clearAllDomainData(): Promise<void>;
}
