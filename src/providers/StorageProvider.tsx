import { useCallback, useEffect, useState, type ReactNode } from "react";
import { IndexedDbRepository } from "@/infrastructure/storage/IndexedDbRepository";
import { initDB, type InitDbCallbacks } from "@/infrastructure/storage/db";
import { StorageContext } from "./StorageContext";

export function StorageProvider({ children }: { children: ReactNode }) {
  const [storage, setStorage] = useState<IndexedDbRepository | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [blockedInfo, setBlockedInfo] = useState<string | null>(null);

  const initialize = useCallback(() => {
    setInitError(null);
    setBlockedInfo(null);

    const callbacks: InitDbCallbacks = {
      onBlocked: ({ blockedVersion }) => {
        setBlockedInfo(
          blockedVersion
            ? `다른 탭에서 데이터베이스 업그레이드가 진행 중입니다. 다른 탭을 닫고 다시 시도해주세요. (target v${blockedVersion})`
            : "다른 탭에서 데이터베이스 업그레이드가 진행 중입니다. 다른 탭을 닫고 다시 시도해주세요."
        );
      },
      onBlocking: ({ blockedVersion }) => {
        setBlockedInfo(
          blockedVersion
            ? `이 탭에서 데이터베이스 업그레이드가 진행 중입니다. 업그레이드가 완료될 때까지 기다려주세요. (target v${blockedVersion})`
            : "이 탭에서 데이터베이스 업그레이드가 진행 중입니다. 업그레이드가 완료될 때까지 기다려주세요."
        );
      },
      onTerminated: () => {
        setInitError("데이터베이스 연결이 예기치 않게 종료되었습니다. 페이지를 새로고침하거나 다시 시도해주세요.");
        setStorage(null);
      },
    };

    initDB(callbacks)
      .then((db) => {
        const repository = new IndexedDbRepository(db);
        setStorage(repository);
      })
      .catch((error) => {
        console.error("Failed to initialize storage:", error);
        setInitError("데이터베이스 초기화에 실패했습니다. 다시 시도해주세요.");
      });
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!storage) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-3"></div>
          {blockedInfo ? (
            <>
              <p className="text-sm text-neutral-800 mb-2">{blockedInfo}</p>
              <button
                type="button"
                onClick={initialize}
                className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-3 py-2 text-sm text-white"
              >
                다시 시도
              </button>
            </>
          ) : initError ? (
            <>
              <p className="text-sm text-neutral-800 mb-2">{initError}</p>
              <button
                type="button"
                onClick={initialize}
                className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-3 py-2 text-sm text-white"
              >
                다시 시도
              </button>
            </>
          ) : (
            <p className="text-sm text-neutral-600">데이터베이스 초기화 중...</p>
          )}
        </div>
      </div>
    );
  }

  return <StorageContext.Provider value={storage}>{children}</StorageContext.Provider>;
}
