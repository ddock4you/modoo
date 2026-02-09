export type StoreName = "plants" | "taskRules" | "taskEvents" | "photos" | "settings";

export const DEBUG_STORE_NAMES = [
  "plants",
  "taskRules",
  "taskEvents",
  "photos",
  "settings",
] as const satisfies readonly StoreName[];

export type StorePrimaryKeyField = "id" | "key";

export const DEBUG_PRIMARY_KEY_FIELD: Record<StoreName, StorePrimaryKeyField> = {
  plants: "id",
  taskRules: "id",
  taskEvents: "id",
  photos: "id",
  settings: "key",
} as const;

export interface StoreInfo {
  name: StoreName;
  count: number;
  indexes: string[];
  keyPath: string;
}

export interface DebugRow {
  store: StoreName;
  primaryKey: string;
  value: unknown;
}
