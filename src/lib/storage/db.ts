import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface ModooDB extends DBSchema {
  plants: {
    key: string;
    value: {
      id: string;
      name: string;
      species: string;
      adoptedAt: number;
      location: string;
      notes: string;
      tags: string; // JSON string
      coverPhotoUri: string;
      createdAt: number;
      updatedAt: number;
    };
    indexes: {
      byName: string;
    };
  };
  taskRules: {
    key: string;
    value: {
      id: string;
      plantId: string;
      type: "water" | "fertilize";
      intervalDays: number;
      lastDoneAt: number | null;
      nextDueAt: number;
      note: string;
      active: 0 | 1;
    };
    indexes: {
      byPlantId: string;
      byType: "water" | "fertilize";
      byNextDueAt: number;
    };
  };
  taskEvents: {
    key: string;
    value: {
      id: string;
      plantId: string;
      type: "water" | "fertilize";
      doneAt: number;
      note: string;
    };
    indexes: {
      byPlantId: string;
      byType: "water" | "fertilize";
      byDoneAt: number;
    };
  };
  photos: {
    key: string;
    value: {
      id: string;
      plantId: string;
      uri: string;
      thumbUri: string;
      width: number;
      height: number;
      size: number;
      createdAt: number;
    };
    indexes: {
      byPlantId: string;
      byCreatedAt: number;
    };
  };
  settings: {
    key: string;
    value: {
      key: string;
      value: string; // JSON string
    };
  };
}

let dbInstance: IDBPDatabase<ModooDB> | null = null;

export async function initDB(): Promise<IDBPDatabase<ModooDB>> {
  if (dbInstance) return dbInstance;

  // 버전 2로 설정 (기존 데이터 유지하면서 새 인덱스 추가 가능하도록)
  dbInstance = await openDB<ModooDB>("modoo", 2, {
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log(`Upgrading DB from ${oldVersion} to ${newVersion}`);

      // 버전별 마이그레이션
      if (oldVersion < 1) {
        // Plants store
        const plantsStore = db.createObjectStore("plants", { keyPath: "id" });
        plantsStore.createIndex("byName", "name");

        // Task Rules store
        const rulesStore = db.createObjectStore("taskRules", { keyPath: "id" });
        rulesStore.createIndex("byPlantId", "plantId");
        rulesStore.createIndex("byType", "type");
        rulesStore.createIndex("byNextDueAt", "nextDueAt");

        // Task Events store
        const eventsStore = db.createObjectStore("taskEvents", { keyPath: "id" });
        eventsStore.createIndex("byPlantId", "plantId");
        eventsStore.createIndex("byType", "type");
        eventsStore.createIndex("byDoneAt", "doneAt");

        // Photos store
        const photosStore = db.createObjectStore("photos", { keyPath: "id" });
        photosStore.createIndex("byPlantId", "plantId");
        photosStore.createIndex("byCreatedAt", "createdAt");

        // Settings store
        db.createObjectStore("settings", { keyPath: "key" });
      }

      // 버전 2로 업그레이드 시 추가 로직 (현재는 없음 - 미래 확장을 위해)
      if (oldVersion < 2) {
        // 예: 새로운 인덱스 추가나 스키마 변경
        console.log("Upgraded to version 2");
      }
    },
    blocked(currentVersion, blockedVersion, event) {
      console.warn("DB upgrade blocked by another tab:", { currentVersion, blockedVersion });
      alert(
        "다른 탭에서 데이터베이스 업그레이드가 진행 중입니다. 다른 탭을 닫고 다시 시도해주세요."
      );
    },
    blocking(currentVersion, blockedVersion, event) {
      console.warn("DB upgrade blocking another tab:", { currentVersion, blockedVersion });
      alert(
        "이 탭에서 데이터베이스 업그레이드가 진행 중입니다. 업그레이드가 완료될 때까지 기다려주세요."
      );
    },
    terminated() {
      console.error("DB connection terminated unexpectedly");
      dbInstance = null;
      alert("데이터베이스 연결이 예기치 않게 종료되었습니다. 페이지를 새로고침해주세요.");
    },
  });

  // Request storage persistence (iOS/Safari에서 자동 정리 방지)
  // if ("storage" in navigator && "persist" in navigator.storage) {
  //   try {
  //     const persisted = await navigator.storage.persist();
  //     if (persisted) {
  //       console.log("Storage persistence granted");
  //     } else {
  //       console.warn("Storage persistence denied");
  //     }
  //   } catch (error) {
  //     console.warn("Storage persistence request failed:", error);
  //   }
  // }

  return dbInstance;
}

export function getDB(): IDBPDatabase<ModooDB> | null {
  return dbInstance;
}

// 개발용 테스트 데이터 추가 함수
// export async function seedTestData(): Promise<void> {
//   const db = getDB();
//   if (!db) throw new Error("Database not initialized");

//   const now = Date.now();

//   // 샘플 식물 데이터
//   const testPlants = [
//     {
//       id: "plant-1",
//       name: "몬스테라",
//       species: "Monstera deliciosa",
//       adoptedAt: now - 30 * 24 * 60 * 60 * 1000, // 30일 전
//       location: "거실",
//       notes: "잎이 큰 몬스테라입니다",
//       tags: JSON.stringify(["관엽식물", "쉽게키우기"]),
//       coverPhotoUri: "",
//       createdAt: now,
//       updatedAt: now,
//     },
//     {
//       id: "plant-2",
//       name: "스킨답서스",
//       species: "Scindapsus aureus",
//       adoptedAt: now - 15 * 24 * 60 * 60 * 1000, // 15일 전
//       location: "침실",
//       notes: "행잉 플랜트로 키우고 있습니다",
//       tags: JSON.stringify(["행잉플랜트", "쉽게키우기"]),
//       coverPhotoUri: "",
//       createdAt: now,
//       updatedAt: now,
//     },
//   ];

//   // 샘플 작업 규칙
//   const testRules = [
//     {
//       id: "rule-1",
//       plantId: "plant-1",
//       type: "water" as const,
//       intervalDays: 7,
//       lastDoneAt: now - 3 * 24 * 60 * 60 * 1000, // 3일 전
//       nextDueAt: now + 4 * 24 * 60 * 60 * 1000, // 4일 후
//       note: "토양 표면이 마르면 물주기",
//       active: 1 as const,
//     },
//     {
//       id: "rule-2",
//       plantId: "plant-1",
//       type: "fertilize" as const,
//       intervalDays: 30,
//       lastDoneAt: now - 20 * 24 * 60 * 60 * 1000, // 20일 전
//       nextDueAt: now + 10 * 24 * 60 * 60 * 1000, // 10일 후
//       note: "봄~가을에 월 1회",
//       active: 1 as const,
//     },
//     {
//       id: "rule-3",
//       plantId: "plant-2",
//       type: "water" as const,
//       intervalDays: 10,
//       lastDoneAt: now - 2 * 24 * 60 * 60 * 1000, // 2일 전
//       nextDueAt: now + 8 * 24 * 60 * 60 * 1000, // 8일 후
//       note: "흙이 완전히 마르면 물주기",
//       active: 1 as const,
//     },
//   ];

//   try {
//     // 기존 데이터 확인
//     const existingPlants = await db.count("plants");
//     const existingRules = await db.count("taskRules");

//     if (existingPlants > 0 || existingRules > 0) {
//       console.log(`Test data already exists: ${existingPlants} plants, ${existingRules} rules`);
//       return;
//     }

//     // 식물 추가 (upsert 방식)
//     for (const plant of testPlants) {
//       await db.put("plants", plant);
//     }

//     // 규칙 추가 (upsert 방식)
//     for (const rule of testRules) {
//       await db.put("taskRules", rule);
//     }

//     console.log("Test data seeded successfully");
//     console.log(`Added ${testPlants.length} plants and ${testRules.length} rules`);
//   } catch (error) {
//     console.warn("Failed to seed test data:", error);
//   }
// }
