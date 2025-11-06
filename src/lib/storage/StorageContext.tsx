import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { IndexedDbRepository, type StorageRepository } from "./StorageRepository";
import { getDB, initDB } from "./db";

const StorageContext = createContext<StorageRepository | null>(null);

export function useStorage() {
  const storage = useContext(StorageContext);
  if (!storage) {
    throw new Error("useStorage must be used within a StorageProvider");
  }
  return storage;
}

export function StorageProvider({ children }: { children: ReactNode }) {
  const [storage, setStorage] = useState<StorageRepository | null>(null);

  useEffect(() => {
    initDB()
      .then((db) => {
        const repository = new IndexedDbRepository(db);
        setStorage(repository);
      })
      .catch((error) => {
        console.error("Failed to initialize storage:", error);
      });
  }, []);

  if (!storage) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-2"></div>
          <p className="text-sm text-neutral-600">데이터베이스 초기화 중...</p>
        </div>
      </div>
    );
  }

  return <StorageContext.Provider value={storage}>{children}</StorageContext.Provider>;
}
