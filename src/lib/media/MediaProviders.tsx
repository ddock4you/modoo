import { Suspense, type ReactNode } from "react";
import type { MediaStore } from "./MediaStore";
import { MediaContext } from "./MediaContext";

// Suspense-compatible MediaStore
let mediaStorePromise: Promise<MediaStore | null> | null = null;
let mediaStoreInstance: MediaStore | null = null;

// Suspense를 위한 초기화 함수
function initializeMediaStore(): Promise<MediaStore | null> {
  if (mediaStorePromise) {
    return mediaStorePromise;
  }

  if (mediaStoreInstance) {
    return Promise.resolve(mediaStoreInstance);
  }

  // 새로 초기화
  mediaStorePromise = (async () => {
    try {
      const { IndexedDBMediaStore } = await import("./IndexedDBMediaStore");
      const store = new IndexedDBMediaStore();

      await store.initialize();
      mediaStoreInstance = store;

      console.log("IndexedDB Media store initialized successfully");
      return store;
    } catch (error) {
      console.error("Failed to initialize IndexedDB media store:", error);
      // IndexedDB 미지원 브라우저에서도 앱이 동작할 수 있도록 null 반환
      return null;
    } finally {
      mediaStorePromise = null; // 초기화 완료
    }
  })();

  return mediaStorePromise;
}

export function MediaProvider({ children }: { children: ReactNode }) {
  // Suspense를 위해 초기화 Promise를 throw
  if (!mediaStoreInstance) {
    throw initializeMediaStore();
  }

  return <MediaContext.Provider value={mediaStoreInstance}>{children}</MediaContext.Provider>;
}

// Suspense boundary를 위한 wrapper 컴포넌트
export function MediaProviderWithSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white text-neutral-900 p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-neutral-600">미디어 저장소 초기화 중...</p>
          </div>
        </div>
      }
    >
      <MediaProvider>{children}</MediaProvider>
    </Suspense>
  );
}
