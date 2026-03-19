import type { StorageRepository } from "../storage/StorageRepository";
import type { MediaStore } from "../media/MediaStore";
import type { BackupData, RestoreOptions, RestoreProgress, RestoreResult } from "./types";
import { parseBackupData, safeParseBackupData } from "./schema";
import { extractZipBackup } from "@/infrastructure/backup/zip";
import { importBackupData } from "./importBackupData";

export async function restoreBackupFromFile(
  storage: StorageRepository,
  media: MediaStore,
  file: File,
  options: RestoreOptions,
  onProgress?: (progress: RestoreProgress) => void
): Promise<RestoreResult> {
  try {
    onProgress?.({ stage: "uploading", message: "파일 업로드 중...", progress: 0 });

    const isZip = file.type === "application/zip" || file.name.endsWith(".zip");

    let backupData: BackupData;
    let photoBlobs = new Map<string, Blob>();

    if (isZip) {
      onProgress?.({ stage: "extracting", message: "압축 해제 중...", progress: 20 });
      const zipResult = await extractZipBackup(file, onProgress);
      backupData = zipResult.data;
      photoBlobs = zipResult.photoBlobs;
    } else {
      const text = await file.text();
      backupData = parseBackupData(JSON.parse(text) as unknown);
    }

    onProgress?.({ stage: "validating", message: "데이터 검증 중...", progress: 40 });
    if (!options.skipValidation) {
      const validation = safeParseBackupData(backupData);
      if (!validation.success) {
        throw new Error(`백업 데이터 검증 실패: ${validation.error}`);
      }
    }

    onProgress?.({ stage: "importing", message: "데이터 복원 중...", progress: 60 });
    const { restored, skipped } = await importBackupData(
      storage,
      media,
      backupData,
      photoBlobs,
      options,
      onProgress
    );

    if (skipped > 0) {
      onProgress?.({
        stage: "importing",
        message: `일부 항목을 건너뛰었습니다: ${skipped}개`,
        progress: 95,
      });
    }

    onProgress?.({ stage: "complete", message: "복원 완료!", progress: 100 });

    return {
      success: true,
      restoredItems: restored,
      skippedItems: skipped > 0 ? skipped : undefined,
    };
  } catch (error) {
    console.error("Restore failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}
