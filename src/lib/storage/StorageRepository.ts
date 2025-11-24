import type {
  Plant,
  PlantStatusInfo,
  PlantsStatusStats,
  TaskEvent,
  TaskRule,
  PhotoMeta,
} from "../../domain/types";
import type { ModooDB } from "./db";
import type { IDBPDatabase } from "idb";
import {
  calculatePlantStatus,
  calculateAllPlantsStatus,
  calculatePlantsStatusStats,
} from "../../domain/use-cases/calculatePlantStatus";

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
}

export class IndexedDbRepository implements StorageRepository {
  private db: IDBPDatabase<ModooDB>;

  constructor(db: IDBPDatabase<ModooDB>) {
    this.db = db;
  }

  // Plants
  async listPlants(params?: { query?: string }): Promise<Plant[]> {
    const tx = this.db.transaction("plants", "readonly");
    const store = tx.objectStore("plants");

    let plants: Plant[] = [];

    if (params?.query) {
      // 이름으로 검색
      const index = store.index("byName");
      const range = IDBKeyRange.bound(params.query, params.query + "\uffff");
      plants = await index.getAll(range);
    } else {
      plants = await store.getAll();
    }

    await tx.done;
    return plants;
  }

  async getPlant(id: string): Promise<Plant | undefined> {
    const plant = await this.db.get("plants", id);
    return plant;
  }

  async upsertPlant(plant: Plant): Promise<void> {
    await this.db.put("plants", plant);
  }

  async deletePlant(id: string): Promise<void> {
    await this.db.delete("plants", id);
  }

  // Task Rules - 일단 빈 구현으로 시작
  async listTaskRules(plantId?: string): Promise<TaskRule[]> {
    const tx = this.db.transaction("taskRules", "readonly");
    const store = tx.objectStore("taskRules");

    let rules: TaskRule[];

    if (plantId) {
      const index = store.index("byPlantId");
      rules = await index.getAll(plantId);
    } else {
      rules = await store.getAll();
    }

    await tx.done;
    return rules;
  }

  async upsertTaskRule(rule: TaskRule): Promise<void> {
    await this.db.put("taskRules", rule);
  }

  async deleteTaskRule(id: string): Promise<void> {
    await this.db.delete("taskRules", id);
  }

  // Task Events
  async listTaskEvents(plantId?: string, type?: "water"): Promise<TaskEvent[]> {
    const tx = this.db.transaction("taskEvents", "readonly");
    const store = tx.objectStore("taskEvents");

    let events: TaskEvent[];

    if (plantId && type) {
      // 식물별 + 유형별 필터링 (복합 인덱스 사용)
      const index = store.index("byPlantId");
      const allEvents = await index.getAll(plantId);
      events = allEvents.filter((event) => event.type === type);
    } else if (plantId) {
      // 식물별 히스토리 조회
      const index = store.index("byPlantId");
      events = await index.getAll(plantId);
    } else if (type) {
      // 유형별 히스토리 조회
      const index = store.index("byType");
      events = await index.getAll(type);
    } else {
      // 전체 히스토리 조회 (최근순 정렬)
      events = await store.getAll();
      events.sort((a, b) => b.doneAt - a.doneAt); // 최신순 정렬
    }

    await tx.done;
    return events;
  }

  async logTaskEvent(event: TaskEvent): Promise<void> {
    await this.db.add("taskEvents", event);
  }

  // Queries
  async getDueTasks(nowMs: number): Promise<Array<{ plant: Plant; rule: TaskRule }>> {
    const tx = this.db.transaction(["taskRules", "plants"], "readonly");
    const ruleStore = tx.objectStore("taskRules");
    const plantStore = tx.objectStore("plants");

    // 새로운 복합 인덱스 사용: [active=1, nextDueAt <= nowMs]
    const index = ruleStore.index("byActiveAndNextDueAt");
    const range = IDBKeyRange.bound([1, 0], [1, nowMs]); // active=1, nextDueAt <= nowMs
    const dueRules = await index.getAll(range);

    const result = await Promise.all(
      dueRules.map(async (rule) => {
        const plant = await plantStore.get(rule.plantId);
        if (plant) {
          return { plant, rule };
        }
        return null;
      })
    );

    await tx.done;
    return result.filter((item): item is { plant: Plant; rule: TaskRule } => item !== null);
  }

  // Photos
  async listPhotos(plantId?: string): Promise<PhotoMeta[]> {
    const tx = this.db.transaction("photos", "readonly");
    const store = tx.objectStore("photos");

    let photos: PhotoMeta[];

    if (plantId) {
      const index = store.index("byPlantId");
      photos = await index.getAll(plantId);
    } else {
      photos = await store.getAll();
    }

    // 최신순 정렬
    photos.sort((a, b) => b.createdAt - a.createdAt);

    await tx.done;
    return photos;
  }

  async getPhoto(id: string): Promise<PhotoMeta | undefined> {
    const photo = await this.db.get("photos", id);
    return photo;
  }

  async upsertPhoto(photo: PhotoMeta): Promise<void> {
    await this.db.put("photos", photo);
  }

  async deletePhoto(id: string): Promise<void> {
    await this.db.delete("photos", id);
  }

  // Plant Status
  async getPlantStatus(plantId: string, nowMs: number = Date.now()): Promise<PlantStatusInfo> {
    const plant = await this.getPlant(plantId);
    if (!plant) {
      throw new Error(`Plant with id ${plantId} not found`);
    }

    const rules = await this.listTaskRules(plantId);
    return calculatePlantStatus(plant, rules, nowMs);
  }

  async getAllPlantsStatus(nowMs: number = Date.now()): Promise<PlantStatusInfo[]> {
    const [plants, rules] = await Promise.all([this.listPlants(), this.listTaskRules()]);
    return calculateAllPlantsStatus(plants, rules, nowMs);
  }

  async getPlantsStatusStats(nowMs: number = Date.now()): Promise<PlantsStatusStats> {
    const statusInfos = await this.getAllPlantsStatus(nowMs);
    return calculatePlantsStatusStats(statusInfos);
  }
}
