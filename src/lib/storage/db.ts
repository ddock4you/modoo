import { openDB, type IDBPDatabase } from "idb";
import type { ModooDB } from "./schema";
import { DB_NAME, DB_VERSION, upgradeDb } from "./migrations";

export type { ModooDB } from "./schema";

export type InitDbCallbacks = {
  onBlocked?: (info: { currentVersion: number; blockedVersion: number | null }) => void;
  onBlocking?: (info: { currentVersion: number; blockedVersion: number | null }) => void;
  onTerminated?: () => void;
};

let dbInstance: IDBPDatabase<ModooDB> | null = null;
let dbPromise: Promise<IDBPDatabase<ModooDB>> | null = null;

export async function initDB(callbacks?: InitDbCallbacks): Promise<IDBPDatabase<ModooDB>> {
  if (dbInstance) return dbInstance;
  if (dbPromise) return dbPromise;

  dbPromise = openDB<ModooDB>(DB_NAME, DB_VERSION, {
    upgrade: upgradeDb,
    blocked(currentVersion, blockedVersion) {
      callbacks?.onBlocked?.({ currentVersion, blockedVersion });
    },
    blocking(currentVersion, blockedVersion) {
      callbacks?.onBlocking?.({ currentVersion, blockedVersion });
    },
    terminated() {
      dbInstance = null;
      dbPromise = null;
      callbacks?.onTerminated?.();
    },
  })
    .then((db) => {
      dbInstance = db;
      return db;
    })
    .catch((err) => {
      dbPromise = null;
      throw err;
    });

  return dbPromise;
}

export function getDB(): IDBPDatabase<ModooDB> | null {
  return dbInstance;
}
