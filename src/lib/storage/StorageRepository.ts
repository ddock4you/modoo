import type { Plant, TaskEvent, TaskRule, TaskType } from "../../domain/types";

export interface StorageRepository {
  // Plants
  listPlants(params?: { query?: string; tag?: string }): Promise<Plant[]>;
  getPlant(id: string): Promise<Plant | undefined>;
  upsertPlant(plant: Plant): Promise<void>;
  deletePlant(id: string): Promise<void>;

  // Task Rules
  listTaskRules(plantId?: string): Promise<TaskRule[]>;
  upsertTaskRule(rule: TaskRule): Promise<void>;
  deleteTaskRule(id: string): Promise<void>;

  // Task Events
  listTaskEvents(plantId?: string, type?: TaskType): Promise<TaskEvent[]>;
  logTaskEvent(event: TaskEvent): Promise<void>;

  // Queries
  getDueTasks(nowMs: number): Promise<Array<{ plant: Plant; rule: TaskRule }>>;
}
