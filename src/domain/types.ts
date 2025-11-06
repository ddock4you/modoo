export type TaskType = "water";

export interface Plant {
  id: string;
  name: string;
  adoptedAt: number; // epoch ms
  humidity: { min: number; max: number } | null; // 습도 범위
  temperature: { min: number; max: number } | null; // 온도 범위
  lightLevel: "low" | "medium" | "high" | null; // 채광량
  isSensitive: boolean; // 예민함 여부 (기본값: false)
  notes: string;
  coverPhotoUri: string;
  createdAt: number;
  updatedAt: number;
}

export interface TaskRule {
  id: string;
  plantId: string;
  type: TaskType;
  intervalDays: number;
  lastDoneAt: number | null;
  nextDueAt: number;
  note: string;
  active: 0 | 1;
  createdAt: number;
  updatedAt: number;
}

export interface TaskEvent {
  id: string;
  plantId: string;
  type: "water"; // 우선은 물주기만 사용
  doneAt: number;
  note: string;
  createdAt: number;
}

export interface PhotoMeta {
  id: string;
  plantId: string;
  uri: string;
  thumbUri: string;
  width: number;
  height: number;
  size: number;
  createdAt: number;
  updatedAt: number;
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
}

export interface SettingKV {
  key: string;
  value: string; // JSON string
  createdAt: number;
  updatedAt: number;
}

// ID 생성 헬퍼 함수
export const generateId = (): string => crypto.randomUUID();

// 기본값 헬퍼 함수들
export const createPlantDefaults = () => ({
  humidity: null,
  temperature: null,
  lightLevel: null as "low" | "medium" | "high" | null,
  isSensitive: false,
  notes: "",
  coverPhotoUri: "",
});

export const createTimestampFields = () => ({
  createdAt: Date.now(),
  updatedAt: Date.now(),
});
