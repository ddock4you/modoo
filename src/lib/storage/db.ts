import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface ModooDB extends DBSchema {
  // 식물 기본 프로필 및 메타데이터 저장
  plants: {
    key: string;
    value: {
      id: string; // 식물 고유 ID
      name: string; // 식물 이름
      adoptedAt: number; // 입양/구입 날짜 (UNIX timestamp)
      humidity: { min: number; max: number } | null; // 습도 범위
      temperature: { min: number; max: number } | null; // 온도 범위
      lightLevel: "low" | "medium" | "high" | null; // 채광량
      isSensitive: boolean; // 예민함 여부
      notes: string; // 메모/특이사항
      coverPhotoUri: string; // 대표 사진 경로
      createdAt: number; // 생성일시 (UNIX timestamp)
      updatedAt: number; // 수정일시 (UNIX timestamp)
    };
    indexes: {
      byName: string;
      byAdoptedAt: number;
    };
  };
  // 물주기, 비료주기 등의 반복 작업 규칙 저장
  taskRules: {
    key: string;
    value: {
      id: string; // 작업 규칙 고유 ID
      plantId: string; // 대상 식물 ID (FK)
      type: "water"; // 작업 유형
      intervalDays: number; // 반복 주기 (일수)
      lastDoneAt: number | null; // 마지막 수행 일시 (UNIX timestamp)
      nextDueAt: number; // 다음 예정 일시 (UNIX timestamp)
      note: string; // 작업 메모/지침
      active: 0 | 1; // 활성화 상태 (0:비활성, 1:활성)
      createdAt: number; // 생성일시
      updatedAt: number; // 수정일시
    };
    indexes: {
      byPlantId: string;
      byType: "water";
      byNextDueAt: number;
      byActiveAndNextDueAt: [0 | 1, number];
      byPlantIdTypeActive: [string, "water", 0 | 1];
    };
  };
  // 실제 수행된 작업(물주기, 비료 등)의 히스토리 저장
  taskEvents: {
    key: string;
    value: {
      id: string; // 작업 이벤트 고유 ID
      plantId: string; // 대상 식물 ID (FK)
      type: "water"; // 작업 유형 (우선은 물주기만 사용)
      doneAt: number; // 실제 수행 일시 (UNIX timestamp)
      note: string; // 수행 시 메모
      createdAt: number; // 생성일시
    };
    indexes: {
      byPlantId: string;
      byType: "water";
      byDoneAt: number;
      byPlantIdAndDoneAt: [string, number];
    };
  };
  // 식물 사진 메타데이터 및 파일 경로 저장 (실제 파일은 IndexedDB에 저장)
  photos: {
    key: string;
    value: {
      id: string; // 사진 고유 ID
      plantId: string; // 대상 식물 ID (FK)
      uri: string; // 원본 사진 파일 경로
      thumbUri: string; // 썸네일 파일 경로
      width: number; // 원본 사진 너비 (px)
      height: number; // 원본 사진 높이 (px)
      size: number; // 파일 크기 (bytes)
      createdAt: number; // 촬영/업로드 일시 (UNIX timestamp)
      updatedAt: number; // 수정일시
      // 대표 사진 표시용 설정 (선택적)
      displayWidth?: number; // 표시용 너비
      displayHeight?: number; // 표시용 높이
      aspectRatio?: number; // 표시 비율
      cropArea?: {
        // 크롭 영역
        x: number;
        y: number;
        width: number;
        height: number;
      };
    };
    indexes: {
      byPlantId: string;
      byCreatedAt: number;
    };
  };
  // 사진 Blob 데이터 저장 (IndexedDB Blob 방식)
  photos_blobs: {
    key: string;
    value: {
      id: string; // 사진 고유 ID
      plantId: string; // 대상 식물 ID (FK)
      originalBlob: Blob; // 원본 사진 Blob
      thumbnailBlob: Blob; // 썸네일 Blob
      metadata: {
        id: string;
        plantId: string;
        uri: string; // Blob URL용 식별자 (실제로는 사용되지 않음)
        thumbUri: string;
        width: number;
        height: number;
        size: number;
        createdAt: number;
        updatedAt: number;
        displayWidth?: number;
        displayHeight?: number;
        aspectRatio?: number;
        cropArea?: {
          x: number;
          y: number;
          width: number;
          height: number;
        };
      };
      createdAt: number; // 생성일시
    };
    indexes: {
      byPlantId: string;
      byCreatedAt: number;
    };
  };
  // 앱 설정 및 환경설정 저장 (키-값 형태)
  settings: {
    key: string;
    value: {
      key: string; // 설정 키
      value: string; // 설정 값 (JSON string)
      createdAt: number; // 생성일시
      updatedAt: number; // 수정일시
    };
  };
}

let dbInstance: IDBPDatabase<ModooDB> | null = null;

export async function initDB(): Promise<IDBPDatabase<ModooDB>> {
  if (dbInstance) return dbInstance;

  // 버전 2로 설정 (Blob 기반 사진 저장 추가)
  dbInstance = await openDB<ModooDB>("modoo", 2, {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    upgrade(db, oldVersion, newVersion, _transaction) {
      console.log(`Upgrading DB from ${oldVersion} to ${newVersion}`);

      // 버전 1: 완전한 스키마 생성
      if (oldVersion < 1) {
        console.log("Creating database version 1 with complete schema");

        // Plants store (완전한 필드 포함)
        const plantsStore = db.createObjectStore("plants", { keyPath: "id" });
        plantsStore.createIndex("byName", "name");
        plantsStore.createIndex("byAdoptedAt", "adoptedAt");

        // Task Rules store (완전한 필드 및 인덱스 포함)
        const rulesStore = db.createObjectStore("taskRules", { keyPath: "id" });
        rulesStore.createIndex("byPlantId", "plantId");
        rulesStore.createIndex("byType", "type");
        rulesStore.createIndex("byNextDueAt", "nextDueAt");
        rulesStore.createIndex("byActiveAndNextDueAt", ["active", "nextDueAt"]);
        rulesStore.createIndex("byPlantIdTypeActive", ["plantId", "type", "active"]);

        // Task Events store (완전한 필드 포함)
        const eventsStore = db.createObjectStore("taskEvents", { keyPath: "id" });
        eventsStore.createIndex("byPlantId", "plantId");
        eventsStore.createIndex("byType", "type");
        eventsStore.createIndex("byDoneAt", "doneAt");
        eventsStore.createIndex("byPlantIdAndDoneAt", ["plantId", "doneAt"]);

        // Photos store
        const photosStore = db.createObjectStore("photos", { keyPath: "id" });
        photosStore.createIndex("byPlantId", "plantId");
        photosStore.createIndex("byCreatedAt", "createdAt");

        // Settings store (완전한 필드 포함)
        db.createObjectStore("settings", { keyPath: "key" });

        console.log("Successfully created database version 1 with complete schema");
      }

      // 버전 2: Blob 기반 사진 저장 추가
      if (oldVersion < 2) {
        console.log("Upgrading to version 2: Adding photos_blobs store");

        // Photos Blobs store (Blob 데이터 저장용)
        const photosBlobsStore = db.createObjectStore("photos_blobs", { keyPath: "id" });
        photosBlobsStore.createIndex("byPlantId", "plantId");
        photosBlobsStore.createIndex("byCreatedAt", "createdAt");

        console.log("Successfully upgraded to database version 2");
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    blocked(currentVersion, blockedVersion, _event) {
      console.warn("DB upgrade blocked by another tab:", { currentVersion, blockedVersion });
      alert(
        "다른 탭에서 데이터베이스 업그레이드가 진행 중입니다. 다른 탭을 닫고 다시 시도해주세요."
      );
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    blocking(currentVersion, blockedVersion, _event) {
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

// ID 생성 헬퍼 함수
export const generateId = (): string => crypto.randomUUID();

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
