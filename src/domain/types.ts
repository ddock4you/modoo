export type TaskType = "water" | "fertilize";

export interface Plant {
  id: string;
  name: string;
  species: string;
  adoptedAt: number; // epoch ms
  location: string;
  notes: string;
  tags: string; // JSON string: string[]
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
}

export interface TaskEvent {
  id: string;
  plantId: string;
  type: TaskType;
  doneAt: number;
  note: string;
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
}

export interface SettingKV {
  key: string;
  value: string; // JSON string
}
