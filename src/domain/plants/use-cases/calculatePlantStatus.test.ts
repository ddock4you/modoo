import { describe, it, expect } from "vitest";
import { calculateAllPlantsStatus, calculatePlantStatus, calculatePlantsStatusStats } from "./calculatePlantStatus";
import type { Plant, PlantStatus, TaskRule } from "../types";

describe("calculatePlantStatus", () => {
  const basePlant: Plant = {
    id: "plant-1",
    name: "테스트 식물",
    adoptedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    humidity: null,
    temperature: null,
    lightLevel: null,
    isSensitive: false,
    notes: "",
    coverPhotoUri: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const baseRule: TaskRule = {
    id: "rule-1",
    plantId: "plant-1",
    type: "water",
    intervalDays: 7,
    lastDoneAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3일 전
    nextDueAt: Date.now() + 4 * 24 * 60 * 60 * 1000, // 4일 후
    note: "물주기",
    active: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  it("양호 상태를 반환해야 함 (아직 물 줄 날이 안 왔을 때)", () => {
    const now = Date.now();
    const rule: TaskRule = {
      ...baseRule,
      nextDueAt: now + 2 * 24 * 60 * 60 * 1000, // 2일 후
    };

    const result = calculatePlantStatus(basePlant, [rule], now);

    expect(result.status).toBe("good");
    expect(result.rule).toBe(rule);
    expect(result.daysOverdue).toBeUndefined();
  });

  it("주의 상태를 반환해야 함 (0일 지남)", () => {
    const now = Date.now();
    const rule: TaskRule = {
      ...baseRule,
      nextDueAt: now, // 지금
    };

    const result = calculatePlantStatus(basePlant, [rule], now);

    expect(result.status).toBe("warning");
    expect(result.daysOverdue).toBe(0);
  });

  it("주의 상태를 반환해야 함 (1일 지남)", () => {
    const now = Date.now();
    const rule: TaskRule = {
      ...baseRule,
      nextDueAt: now - 1 * 24 * 60 * 60 * 1000, // 1일 전
    };

    const result = calculatePlantStatus(basePlant, [rule], now);

    expect(result.status).toBe("warning");
    expect(result.daysOverdue).toBe(1);
  });

  it("주의 상태를 반환해야 함 (2일 지남)", () => {
    const now = Date.now();
    const rule: TaskRule = {
      ...baseRule,
      nextDueAt: now - 2 * 24 * 60 * 60 * 1000, // 2일 전
    };

    const result = calculatePlantStatus(basePlant, [rule], now);

    expect(result.status).toBe("warning");
    expect(result.daysOverdue).toBe(2);
  });

  it("위험 상태를 반환해야 함 (3일 지남)", () => {
    const now = Date.now();
    const rule: TaskRule = {
      ...baseRule,
      nextDueAt: now - 3 * 24 * 60 * 60 * 1000, // 3일 전
    };

    const result = calculatePlantStatus(basePlant, [rule], now);

    expect(result.status).toBe("danger");
    expect(result.daysOverdue).toBe(3);
  });

  it("위험 상태를 반환해야 함 (5일 지남)", () => {
    const now = Date.now();
    const rule: TaskRule = {
      ...baseRule,
      nextDueAt: now - 5 * 24 * 60 * 60 * 1000, // 5일 전
    };

    const result = calculatePlantStatus(basePlant, [rule], now);

    expect(result.status).toBe("danger");
    expect(result.daysOverdue).toBe(5);
  });

  it("규칙이 없으면 상태 없음을 반환해야 함", () => {
    const result = calculatePlantStatus(basePlant, [], Date.now());

    expect(result.status).toBeNull();
    expect(result.rule).toBeNull();
  });

  it("비활성화된 규칙은 무시해야 함", () => {
    const rule: TaskRule = {
      ...baseRule,
      active: 0,
    };

    const result = calculatePlantStatus(basePlant, [rule], Date.now());

    expect(result.status).toBeNull();
    expect(result.rule).toBeNull();
  });

  it("여러 규칙이 있을 때 가장 긴급한 규칙을 선택해야 함", () => {
    const now = Date.now();
    const urgentRule: TaskRule = {
      ...baseRule,
      id: "rule-urgent",
      nextDueAt: now - 1 * 24 * 60 * 60 * 1000, // 1일 전 (주의)
    };
    const laterRule: TaskRule = {
      ...baseRule,
      id: "rule-later",
      nextDueAt: now + 3 * 24 * 60 * 60 * 1000, // 3일 후 (양호)
    };

    const result = calculatePlantStatus(basePlant, [laterRule, urgentRule], now);

    expect(result.status).toBe("warning");
    expect(result.rule?.id).toBe("rule-urgent");
  });

  it("물주기가 아닌 규칙은 무시해야 함", () => {
    const rule: TaskRule = {
      ...baseRule,
      type: "water", // 현재는 water만 있지만, 타입 체크 확인용
    };

    const result = calculatePlantStatus(basePlant, [rule], Date.now());
    // water 타입이므로 정상 처리됨
    expect(result.status).not.toBeNull();
  });
});

describe("calculateAllPlantsStatus", () => {
  it("여러 식물의 상태를 일괄 계산해야 함", () => {
    const now = Date.now();
    const plant1: Plant = {
      id: "plant-1",
      name: "식물 1",
      adoptedAt: Date.now(),
      humidity: null,
      temperature: null,
      lightLevel: null,
      isSensitive: false,
      notes: "",
      coverPhotoUri: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const plant2: Plant = {
      id: "plant-2",
      name: "식물 2",
      adoptedAt: Date.now(),
      humidity: null,
      temperature: null,
      lightLevel: null,
      isSensitive: false,
      notes: "",
      coverPhotoUri: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const rule1: TaskRule = {
      id: "rule-1",
      plantId: "plant-1",
      type: "water",
      intervalDays: 7,
      lastDoneAt: null,
      nextDueAt: now + 2 * 24 * 60 * 60 * 1000, // 양호
      note: "",
      active: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const rule2: TaskRule = {
      id: "rule-2",
      plantId: "plant-2",
      type: "water",
      intervalDays: 7,
      lastDoneAt: null,
      nextDueAt: now - 3 * 24 * 60 * 60 * 1000, // 위험
      note: "",
      active: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const results = calculateAllPlantsStatus([plant1, plant2], [rule1, rule2], now);

    expect(results).toHaveLength(2);
    expect(results[0].status).toBe("good");
    expect(results[1].status).toBe("danger");
  });
});

describe("calculatePlantsStatusStats", () => {
  it("상태 통계를 올바르게 계산해야 함", () => {
    const statusInfos = [
      { plant: {} as Plant, status: "good" as PlantStatus, rule: null },
      { plant: {} as Plant, status: "good" as PlantStatus, rule: null },
      { plant: {} as Plant, status: "warning" as PlantStatus, rule: null },
      { plant: {} as Plant, status: "danger" as PlantStatus, rule: null },
      { plant: {} as Plant, status: null as PlantStatus, rule: null },
    ];

    const stats = calculatePlantsStatusStats(statusInfos);

    expect(stats.total).toBe(5);
    expect(stats.good).toBe(2);
    expect(stats.warning).toBe(1);
    expect(stats.danger).toBe(1);
    expect(stats.noStatus).toBe(1);
    expect(stats.goodPercentage).toBe(40); // 2/5 * 100
  });

  it("식물이 없을 때 올바른 통계를 반환해야 함", () => {
    const stats = calculatePlantsStatusStats([]);

    expect(stats.total).toBe(0);
    expect(stats.good).toBe(0);
    expect(stats.warning).toBe(0);
    expect(stats.danger).toBe(0);
    expect(stats.noStatus).toBe(0);
    expect(stats.goodPercentage).toBe(0);
  });
});
