import { useEffect, useState, type ReactNode } from "react";
import type { MediaStore } from "./MediaStore";
import { MediaContext } from "./MediaContext";
import { UnsupportedMediaStore } from "./UnsupportedMediaStore";

export function MediaProvider({ children }: { children: ReactNode }) {
  const [media, setMedia] = useState<MediaStore | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { IndexedDbMediaStore } = await import("./indexeddb/IndexedDbMediaStore");
        const store = new IndexedDbMediaStore();
        await store.initialize();
        if (!cancelled) setMedia(store);
      } catch (error) {
        console.error("Failed to initialize media store:", error);
        const message = error instanceof Error ? error.message : "Media store initialization failed";
        if (!cancelled) setMedia(new UnsupportedMediaStore(message));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!media) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-2" />
          <p className="text-sm text-neutral-600">미디어 저장소 초기화 중...</p>
        </div>
      </div>
    );
  }

  return <MediaContext.Provider value={media}>{children}</MediaContext.Provider>;
}
