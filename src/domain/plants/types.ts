export type TaskType = "water";

export type PlantStatus = "good" | "warning" | "danger" | null;

export interface PlantStatusInfo {
  plant: Plant;
  status: PlantStatus;
  rule: TaskRule | null;
  daysOverdue?: number;
}

export interface PlantsStatusStats {
  total: number;
  good: number;
  warning: number;
  danger: number;
  noStatus: number;
  goodPercentage: number;
}

export interface Plant {
  id: string;
  name: string;
  adoptedAt: number;
  humidity: { min: number; max: number } | null;
  temperature: { min: number; max: number } | null;
  lightLevel: "low" | "medium" | "high" | null;
  isSensitive: boolean;
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
  type: TaskType;
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
  displayWidth?: number;
  displayHeight?: number;
  aspectRatio?: number;
  cropArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
