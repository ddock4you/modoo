import type { StorageRepository } from "../storage/StorageRepository";
import type { MediaStore } from "../media/MediaStore";
import type { BackupData, BackupOptions, BackupProgress, BackupResult } from "./types";
import { createZipBackup } from "@/infrastructure/backup/zip";
import { buildMetadata, dateStamp } from "./utils";

export async function createBackupFile(
  storage: StorageRepository,
  media: MediaStore,
  options: BackupOptions,
  onProgress?: (progress: BackupProgress) => void
): Promise<BackupResult> {
  try {
    onProgress?.({ stage: "preparing", message: "백업 준비 중...", progress: 0 });

    // 1) IndexedDB 데이터 수집
    onProgress?.({ stage: "exporting", message: "데이터 내보내기 중...", progress: 10 });
    const [plants, taskRules, taskEvents, photos, settings] = await Promise.all([
      storage.listPlants(),
      storage.listTaskRules(),
      storage.listTaskEvents(),
      storage.listPhotos(),
      [], // settings는 아직 구현되지 않음
    ]);

    // 2) 백업 데이터 구성
    const backupData: BackupData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      appVersion: options.appVersion ?? "1.0.0", // TODO: 실제 앱 버전으로 교체
      plants,
      taskRules,
      taskEvents,
      photos,
      settings,
    };

    onProgress?.({ stage: "exporting", message: "데이터 내보내기 완료", progress: 40 });

    // 3) JSON 직렬화
    const jsonString = JSON.stringify(backupData, null, 2);

    // 4) 파일 생성 (사진 포함 시 ZIP)
    let blob: Blob;
    let filename: string;
    let format: "json" | "zip";

    if (options.includePhotos && photos.length > 0) {
      onProgress?.({ stage: "compressing", message: "사진 데이터 압축 중...", progress: 50 });
      blob = await createZipBackup({
        backupJson: jsonString,
        metadata: buildMetadata(backupData),
        photos,
        media,
        onProgress,
      });
      filename = options.filename ?? `modoo-backup-${dateStamp()}.zip`;
      format = "zip";
    } else {
      blob = new Blob([jsonString], { type: "application/json" });
      filename = options.filename ?? `modoo-backup-${dateStamp()}.json`;
      format = "json";
    }

    // 다운로드는 UI 레이어에서 처리
    onProgress?.({ stage: "downloading", message: "파일 다운로드 준비 완료", progress: 90 });
    onProgress?.({ stage: "complete", message: "백업 완료!", progress: 100 });

    return {
      success: true,
      blob,
      filename,
      size: blob.size,
      format,
      metadata: buildMetadata(backupData, blob.size),
    };
  } catch (error) {
    console.error("Backup failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}
