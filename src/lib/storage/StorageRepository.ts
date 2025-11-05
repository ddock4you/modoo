import type { Plant, TaskEvent, TaskRule, TaskType } from "../../domain/types";
import type { IDBPDatabase, ModooDB } from "./db";

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

export class IndexedDbRepository implements StorageRepository {
  constructor(private db: IDBPDatabase<ModooDB>) {}

  // Plants
  async listPlants(params?: { query?: string; tag?: string }): Promise<Plant[]> {
    const tx = this.db.transaction("plants", "readonly");
    const store = tx.objectStore("plants");

    let plants: Plant[] = [];

    if (params?.query) {
      // 이름으로 검색
      const index = store.index("byName");
      const range = IDBKeyRange.bound(params.query, params.query + "\uffff");
      plants = await index.getAll(range);
    } else if (params?.tag) {
      // 태그로 필터링 (JSON 문자열에서 검색)
      const allPlants = await store.getAll();
      plants = allPlants.filter((plant) => {
        try {
          const tags = JSON.parse(plant.tags);
          return Array.isArray(tags) && tags.includes(params.tag);
        } catch {
          return false;
        }
      });
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

  // Task Events - 일단 빈 구현으로 시작
  async listTaskEvents(plantId?: string, type?: TaskType): Promise<TaskEvent[]> {
    const tx = this.db.transaction("taskEvents", "readonly");
    const store = tx.objectStore("taskEvents");

    let events: TaskEvent[];

    if (plantId && type) {
      const index = store.index("byPlantId");
      const allEvents = await index.getAll(plantId);
      events = allEvents.filter((event) => event.type === type);
    } else if (plantId) {
      const index = store.index("byPlantId");
      events = await index.getAll(plantId);
    } else if (type) {
      const index = store.index("byType");
      events = await index.getAll(type);
    } else {
      events = await store.getAll();
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
}
