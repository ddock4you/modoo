import {
  calculateAllPlantsStatus,
  calculatePlantStatus,
  calculatePlantsStatusStats,
} from "@/domain";
import type {
  PhotoMeta,
  Plant,
  PlantStatusInfo,
  PlantsStatusStats,
  TaskEvent,
  TaskRule,
} from "@/domain/types";
import type { IDBPDatabase } from "idb";
import type { ModooDB } from "./schema";
import type { StorageRepository } from "./StorageRepository";

export class IndexedDbRepository implements StorageRepository {
  private db: IDBPDatabase<ModooDB>;

  constructor(db: IDBPDatabase<ModooDB>) {
    this.db = db;
  }

  async listPlants(params?: { query?: string }): Promise<Plant[]> {
    const tx = this.db.transaction("plants", "readonly");
    const store = tx.objectStore("plants");

    let plants: Plant[];

    if (params?.query) {
      const index = store.index("byName");
      const range = IDBKeyRange.bound(params.query, `${params.query}\uffff`);
      plants = await index.getAll(range);
    } else {
      plants = await store.getAll();
    }

    await tx.done;
    return plants;
  }

  async getPlant(id: string): Promise<Plant | undefined> {
    return this.db.get("plants", id);
  }

  async upsertPlant(plant: Plant): Promise<void> {
    await this.db.put("plants", plant);
  }

  async deletePlant(id: string): Promise<void> {
    await this.db.delete("plants", id);
  }

  async listTaskRules(plantId?: string): Promise<TaskRule[]> {
    const tx = this.db.transaction("taskRules", "readonly");
    const store = tx.objectStore("taskRules");

    const rules = plantId ? await store.index("byPlantId").getAll(plantId) : await store.getAll();
    await tx.done;
    return rules;
  }

  async upsertTaskRule(rule: TaskRule): Promise<void> {
    await this.db.put("taskRules", rule);
  }

  async deleteTaskRule(id: string): Promise<void> {
    await this.db.delete("taskRules", id);
  }

  async listTaskEvents(plantId?: string, type?: "water"): Promise<TaskEvent[]> {
    const tx = this.db.transaction("taskEvents", "readonly");
    const store = tx.objectStore("taskEvents");

    const events: TaskEvent[] = [];

    if (plantId && type) {
      const index = store.index("byPlantIdTypeAndDoneAt");
      const range = IDBKeyRange.bound(
        [plantId, type, 0],
        [plantId, type, Number.MAX_SAFE_INTEGER]
      );

      for (let cursor = await index.openCursor(range, "prev"); cursor; cursor = await cursor.continue()) {
        events.push(cursor.value);
      }

      await tx.done;
      return events;
    }

    if (plantId) {
      const index = store.index("byPlantIdAndDoneAt");
      const range = IDBKeyRange.bound([plantId, 0], [plantId, Number.MAX_SAFE_INTEGER]);

      for (let cursor = await index.openCursor(range, "prev"); cursor; cursor = await cursor.continue()) {
        events.push(cursor.value);
      }

      await tx.done;
      return events;
    }

    if (type) {
      const index = store.index("byTypeAndDoneAt");
      const range = IDBKeyRange.bound([type, 0], [type, Number.MAX_SAFE_INTEGER]);

      for (let cursor = await index.openCursor(range, "prev"); cursor; cursor = await cursor.continue()) {
        events.push(cursor.value);
      }

      await tx.done;
      return events;
    }

    const index = store.index("byDoneAt");
    for (let cursor = await index.openCursor(null, "prev"); cursor; cursor = await cursor.continue()) {
      events.push(cursor.value);
    }

    await tx.done;
    return events;
  }

  async logTaskEvent(event: TaskEvent): Promise<void> {
    await this.db.add("taskEvents", event);
  }

  async upsertTaskEvent(event: TaskEvent): Promise<void> {
    await this.db.put("taskEvents", event);
  }

  async listPhotos(plantId?: string): Promise<PhotoMeta[]> {
    const tx = this.db.transaction("photos", "readonly");
    const store = tx.objectStore("photos");

    const photos = plantId ? await store.index("byPlantId").getAll(plantId) : await store.getAll();
    photos.sort((a, b) => b.createdAt - a.createdAt);

    await tx.done;
    return photos;
  }

  async getPhoto(id: string): Promise<PhotoMeta | undefined> {
    return this.db.get("photos", id);
  }

  async upsertPhoto(photo: PhotoMeta): Promise<void> {
    await this.db.put("photos", photo);
  }

  async deletePhoto(id: string): Promise<void> {
    await this.db.delete("photos", id);
  }

  async getDueTasks(nowMs: number): Promise<Array<{ plant: Plant; rule: TaskRule }>> {
    const tx = this.db.transaction(["taskRules", "plants"], "readonly");
    const ruleStore = tx.objectStore("taskRules");
    const plantStore = tx.objectStore("plants");

    const index = ruleStore.index("byActiveAndNextDueAt");
    const range = IDBKeyRange.bound([1, 0], [1, nowMs]);
    const dueRules = await index.getAll(range);

    const result = await Promise.all(
      dueRules.map(async (rule) => {
        const plant = await plantStore.get(rule.plantId);
        return plant ? { plant, rule } : null;
      })
    );

    await tx.done;
    return result.filter((item): item is { plant: Plant; rule: TaskRule } => item !== null);
  }

  async getPlantStatus(plantId: string, nowMs: number = Date.now()): Promise<PlantStatusInfo> {
    const plant = await this.getPlant(plantId);
    if (!plant) throw new Error(`Plant with id ${plantId} not found`);

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

  async clearAllDomainData(): Promise<void> {
    const tx = this.db.transaction(["plants", "taskRules", "taskEvents", "photos", "settings"], "readwrite");
    await Promise.all([
      tx.objectStore("plants").clear(),
      tx.objectStore("taskRules").clear(),
      tx.objectStore("taskEvents").clear(),
      tx.objectStore("photos").clear(),
      tx.objectStore("settings").clear(),
    ]);
    await tx.done;
  }
}
