export type StoreName = "plants" | "taskRules" | "taskEvents" | "photos" | "settings";

export interface StoreInfo {
  name: StoreName;
  count: number;
  indexes: string[];
}
