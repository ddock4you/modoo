import { getDB } from "@/infrastructure/storage/db";
import type { ModooDB } from "@/infrastructure/storage/db";
import type { StoreInfo, StoreName, DebugRow } from "../types";
import { DEBUG_STORE_NAMES } from "../types";

function normalizeKeyPath(keyPath: IDBObjectStore["keyPath"]): string {
  if (typeof keyPath === "string") return keyPath;
  if (Array.isArray(keyPath)) return keyPath.join(",");
  return "";
}

function primaryKeyToString(key: IDBValidKey): string {
  return typeof key === "string" ? key : String(key);
}

export async function listStoresInfo(): Promise<StoreInfo[]> {
  const db = getDB();
  if (!db) throw new Error("Database not initialized");

  const stores: StoreInfo[] = [];

  for (const storeName of DEBUG_STORE_NAMES) {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const count = await store.count();

    stores.push({
      name: storeName,
      count,
      indexes: Array.from(store.indexNames),
      keyPath: normalizeKeyPath(store.keyPath),
    });

    await tx.done;
  }

  return stores;
}

export async function listStoreRows(params: {
  storeName: StoreName;
  offset: number;
  limit: number;
}): Promise<DebugRow[]> {
  const { storeName, offset, limit } = params;
  const db = getDB();
  if (!db) throw new Error("Database not initialized");

  const tx = db.transaction(storeName, "readonly");
  const store = tx.objectStore(storeName);

  const items: DebugRow[] = [];
  let cursor = await store.openCursor();
  let skipped = 0;

  while (cursor && skipped < offset) {
    skipped += 1;
    cursor = await cursor.continue();
  }

  while (cursor && items.length < limit) {
    items.push({
      store: storeName,
      primaryKey: primaryKeyToString(cursor.key),
      value: cursor.value,
    });
    cursor = await cursor.continue();
  }

  await tx.done;
  return items;
}

export async function putStoreRow(params: {
  storeName: StoreName;
  value: unknown;
}): Promise<void> {
  const { storeName, value } = params;
  const db = getDB();
  if (!db) throw new Error("Database not initialized");

  // debug tool: accept arbitrary shape and rely on IDB keyPath validation
  await db.put(storeName, value as ModooDB[StoreName]["value"]);
}

export async function deleteStoreRow(params: {
  storeName: StoreName;
  primaryKey: IDBValidKey;
}): Promise<void> {
  const { storeName, primaryKey } = params;
  const db = getDB();
  if (!db) throw new Error("Database not initialized");

  await db.delete(storeName, primaryKey as ModooDB[StoreName]["key"]);
}
