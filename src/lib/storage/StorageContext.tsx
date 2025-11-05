import React, { createContext, useContext, useEffect, useState } from "react";
import { IndexedDbRepository, type StorageRepository } from "./StorageRepository";
import { initDB, type IDBPDatabase, type ModooDB } from "./db";

const StorageContext = createContext<StorageRepository | null>(null);

export function useStorage(): StorageRepository {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error("useStorage must be used within a StorageProvider");
  }
  return context;
}

interface StorageProviderProps {
  children: React.ReactNode;
}

export function StorageProvider({ children }: StorageProviderProps) {
  const [repository, setRepository] = useState<StorageRepository | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeStorage = async () => {
      try {
        const db = await initDB();
        const repo = new IndexedDbRepository(db);
        setRepository(repo);
      } catch (err) {
        console.error("Failed to initialize storage:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    initializeStorage();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">데이터베이스 초기화 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="font-semibold mb-2">데이터베이스 초기화 실패</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  return <StorageContext.Provider value={repository}>{children}</StorageContext.Provider>;
}
