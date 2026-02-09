import type { StoreName } from "../types";

export const DEBUG_QK = {
  all: () => ["debug"] as const,
  storesInfo: () => ["debug", "storesInfo"] as const,
  storeData: (store: StoreName, offset: number, limit: number) =>
    ["debug", "storeData", store, offset, limit] as const,
} as const;
