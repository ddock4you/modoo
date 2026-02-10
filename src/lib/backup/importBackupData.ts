import type { StorageRepository } from "../storage/StorageRepository";
import type { MediaStore } from "../media/MediaStore";
import type { BackupData, RestoreOptions, RestoreProgress } from "./types";

export async function importBackupData(
  storage: StorageRepository,
  media: MediaStore,
  data: BackupData,
  photoBlobs: Map<string, Blob>,
  options: RestoreOptions,
  onProgress?: (progress: RestoreProgress) => void
): Promise<{ restored: { plants: number; photos: number; taskRules: number; taskEvents: number }; skipped: number }> {
  const restored = { plants: 0, photos: 0, taskRules: 0, taskEvents: 0 };
  let skipped = 0;

  if (options.mode === "overwrite") {
    onProgress?.({ stage: "importing", message: "기존 데이터 정리 중...", progress: 65 });
    await storage.clearAllDomainData();
    await media.clearAll?.();
  }

  onProgress?.({ stage: "importing", message: "식물 데이터 복원 중...", progress: 70 });
  for (const plant of data.plants) {
    await storage.upsertPlant(plant);
    restored.plants++;
  }

  onProgress?.({ stage: "importing", message: "작업 규칙 복원 중...", progress: 80 });
  for (const rule of data.taskRules) {
    await storage.upsertTaskRule(rule);
    restored.taskRules++;
  }

  onProgress?.({ stage: "importing", message: "작업 기록 복원 중...", progress: 90 });
  for (const event of data.taskEvents) {
    try {
      await storage.upsertTaskEvent(event);
      restored.taskEvents++;
    } catch (error) {
      skipped++;
      console.warn(`작업 기록 ${event.id} 복원 실패:`, error);
    }
  }

  if (data.photos.length > 0) {
    onProgress?.({ stage: "importing", message: "사진 데이터 복원 중...", progress: 90 });
    for (const photo of data.photos) {
      try {
        await storage.upsertPhoto(photo);

        const blob = photoBlobs.get(photo.id);
        if (blob) {
          await media.saveBlob(photo.id, blob);
        }

        restored.photos++;
      } catch (error) {
        skipped++;
        console.warn(`사진 ${photo.id} 복원 실패:`, error);
      }
    }
  }

  return { restored, skipped };
}
