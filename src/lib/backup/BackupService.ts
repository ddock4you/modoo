import type {
  BackupService,
  BackupData,
  BackupMetadata,
  BackupOptions,
  BackupProgress,
  BackupResult,
  RestoreOptions,
  RestoreProgress,
  RestoreResult,
} from "./types";
import type { StorageRepository } from "../storage/StorageRepository";
import type { MediaStore } from "../media/MediaStore";

/**
 * 백업/복원 서비스 구현체
 */
export class IndexedDBBackupService implements BackupService {
  private storage: StorageRepository;
  private media: MediaStore;

  constructor(storage: StorageRepository, media: MediaStore) {
    this.storage = storage;
    this.media = media;
  }

  /**
   * 전체 데이터 백업 생성
   */
  async createBackup(
    options: BackupOptions = { includePhotos: true },
    onProgress?: (progress: BackupProgress) => void
  ): Promise<BackupResult> {
    try {
      onProgress?.({ stage: "preparing", message: "백업 준비 중...", progress: 0 });

      // 1. IndexedDB 데이터 수집
      onProgress?.({ stage: "exporting", message: "데이터 내보내기 중...", progress: 10 });

      const [plants, taskRules, taskEvents, photos, settings] = await Promise.all([
        this.storage.listPlants(),
        this.storage.listTaskRules(),
        this.storage.listTaskEvents(),
        this.storage.listPhotos(),
        [], // settings는 아직 구현되지 않음
      ]);

      // 2. 백업 데이터 구조 생성
      const backupData: BackupData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        appVersion: "1.0.0", // TODO: 실제 앱 버전으로 교체
        plants,
        taskRules,
        taskEvents,
        photos,
        settings,
      };

      onProgress?.({ stage: "exporting", message: "데이터 내보내기 완료", progress: 40 });

      // 3. JSON 직렬화
      const jsonString = JSON.stringify(backupData, null, 2);

      // 4. 사진 데이터 포함 여부 확인
      let finalBlob: Blob;
      let filename: string;

      if (options.includePhotos && photos.length > 0) {
        onProgress?.({ stage: "compressing", message: "사진 데이터 압축 중...", progress: 50 });

        // 사진이 있는 경우 ZIP 생성
        finalBlob = await this.createZipBackup(jsonString, photos, onProgress);
        filename = `modoo-backup-${new Date().toISOString().split("T")[0]}.zip`;
      } else {
        // 사진 없는 경우 JSON 파일만
        finalBlob = new Blob([jsonString], { type: "application/json" });
        filename = `modoo-backup-${new Date().toISOString().split("T")[0]}.json`;
      }

      // 5. 파일 다운로드
      onProgress?.({ stage: "downloading", message: "파일 다운로드 준비 중...", progress: 90 });

      const url = URL.createObjectURL(finalBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onProgress?.({ stage: "complete", message: "백업 완료!", progress: 100 });

      return {
        success: true,
        filename,
        size: finalBlob.size,
        metadata: {
          version: backupData.version,
          created: backupData.timestamp,
          appVersion: backupData.appVersion,
          totalPlants: plants.length,
          totalPhotos: photos.length,
          totalTaskRules: taskRules.length,
          totalTaskEvents: taskEvents.length,
          compressedSize: finalBlob.size,
        },
      };
    } catch (error) {
      console.error("Backup failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      };
    }
  }

  /**
   * 백업 파일에서 데이터 복원
   */
  async restoreBackup(
    file: File,
    options: RestoreOptions = { overwriteExisting: false },
    onProgress?: (progress: RestoreProgress) => void
  ): Promise<RestoreResult> {
    try {
      onProgress?.({ stage: "uploading", message: "파일 업로드 중...", progress: 0 });

      // 파일 타입 확인
      const isZip = file.type === "application/zip" || file.name.endsWith(".zip");

      let backupData: BackupData;
      let photoBlobs = new Map<string, Blob>();

      if (isZip) {
        // ZIP 파일 처리
        onProgress?.({ stage: "extracting", message: "압축 해제 중...", progress: 20 });
        const zipResult = await this.extractZipBackup(file, onProgress);
        backupData = zipResult.data;
        photoBlobs = zipResult.photoBlobs;
      } else {
        // JSON 파일 처리
        const text = await file.text();
        backupData = JSON.parse(text);
      }

      // 데이터 검증
      onProgress?.({ stage: "validating", message: "데이터 검증 중...", progress: 40 });
      const validation = this.validateBackupData(backupData);
      if (!validation.valid) {
        throw new Error(`백업 데이터 검증 실패: ${validation.error}`);
      }

      // 데이터 복원
      onProgress?.({ stage: "importing", message: "데이터 복원 중...", progress: 60 });

      const results = await this.importBackupData(backupData, photoBlobs, options, onProgress);

      onProgress?.({ stage: "complete", message: "복원 완료!", progress: 100 });

      return {
        success: true,
        restoredItems: results,
      };
    } catch (error) {
      console.error("Restore failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      };
    }
  }

  /**
   * 백업 파일 검증
   */
  async validateBackup(
    file: File
  ): Promise<{ valid: boolean; metadata?: BackupMetadata; error?: string }> {
    try {
      const isZip = file.type === "application/zip" || file.name.endsWith(".zip");

      if (isZip) {
        // ZIP 파일에서 메타데이터만 추출
        const { default: JSZip } = await import("jszip");
        const zip = await JSZip.loadAsync(file);

        const metadataFile = zip.file("metadata.json");
        if (!metadataFile) {
          return { valid: false, error: "메타데이터 파일이 없습니다" };
        }

        const metadataText = await metadataFile.async("string");
        const metadata: BackupMetadata = JSON.parse(metadataText);

        return { valid: true, metadata };
      } else {
        // JSON 파일 검증
        const text = await file.text();
        const data = JSON.parse(text);
        const validation = this.validateBackupData(data);

        if (!validation.valid) {
          return { valid: false, error: validation.error };
        }

        return {
          valid: true,
          metadata: {
            version: data.version,
            created: data.timestamp,
            appVersion: data.appVersion,
            totalPlants: data.plants?.length || 0,
            totalPhotos: data.photos?.length || 0,
            totalTaskRules: data.taskRules?.length || 0,
            totalTaskEvents: data.taskEvents?.length || 0,
          },
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "파일 검증 실패",
      };
    }
  }

  /**
   * ZIP 백업 생성 (JSON + 사진)
   */
  private async createZipBackup(
    jsonString: string,
    photos: any[],
    onProgress?: (progress: BackupProgress) => void
  ): Promise<Blob> {
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();

    // 메타데이터 추가
    const metadata = {
      version: "1.0",
      created: new Date().toISOString(),
      appVersion: "1.0.0",
      compressor: "jszip",
    };
    zip.file("metadata.json", JSON.stringify(metadata, null, 2));

    // 데이터 파일 추가
    zip.file("backup.json", jsonString);

    // 사진 파일들 추가 (있는 경우)
    if (photos.length > 0) {
      zip.folder("photos");

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        onProgress?.({
          stage: "compressing",
          message: `사진 백업 중... (${i + 1}/${photos.length})`,
          progress: 50 + (i / photos.length) * 40,
          currentItem: photo.id,
        });

        try {
          // MediaStore에서 사진 blob 가져오기
          const blob = await this.media.getBlob(photo.id);

          // 파일 확장자 결정 (메타데이터에 타입 정보가 없을 수 있으므로 기본적으로 jpg로 가정)
          const extension = photo.uri.split(".").pop() || "jpg";
          const filename = `${photo.id}.${extension}`;

          zip.file(`photos/${filename}`, blob);
        } catch (error) {
          console.warn(`사진 ${photo.id} 백업 실패:`, error);
        }
      }
    }

    return zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });
  }

  /**
   * ZIP 백업 해제
   */
  private async extractZipBackup(
    file: File,
    _onProgress?: (progress: RestoreProgress) => void
  ): Promise<{ data: BackupData; photoBlobs: Map<string, Blob> }> {
    const { default: JSZip } = await import("jszip");
    const zip = await JSZip.loadAsync(file);

    // 메타데이터 확인
    const metadataFile = zip.file("metadata.json");
    if (!metadataFile) {
      throw new Error("유효하지 않은 백업 파일: 메타데이터가 없습니다");
    }

    // 데이터 파일 추출
    const backupFile = zip.file("backup.json");
    if (!backupFile) {
      throw new Error("유효하지 않은 백업 파일: 백업 데이터가 없습니다");
    }

    const jsonText = await backupFile.async("string");
    const data: BackupData = JSON.parse(jsonText);

    // 사진 파일들 추출
    const photoBlobs = new Map<string, Blob>();
    const photoFiles = zip.folder("photos");

    if (photoFiles) {
      for (const filename in photoFiles.files) {
        if (!photoFiles.files[filename].dir) {
          try {
            const photoId = filename.replace(/^photos\//, "").replace(/\.[^.]+$/, "");
            const blob = await photoFiles.files[filename].async("blob");
            photoBlobs.set(photoId, blob);
          } catch (error) {
            console.warn(`사진 파일 ${filename} 추출 실패:`, error);
          }
        }
      }
    }

    return { data, photoBlobs };
  }

  /**
   * 백업 데이터 검증
   */
  private validateBackupData(data: any): { valid: boolean; error?: string } {
    if (!data || typeof data !== "object") {
      return { valid: false, error: "유효하지 않은 데이터 형식" };
    }

    if (!data.version || !data.timestamp) {
      return { valid: false, error: "필수 메타데이터가 없습니다" };
    }

    // 필수 배열 필드들 확인
    const requiredArrays = ["plants", "taskRules", "taskEvents"];
    for (const field of requiredArrays) {
      if (!Array.isArray(data[field])) {
        return { valid: false, error: `${field} 필드가 배열이 아닙니다` };
      }
    }

    return { valid: true };
  }

  /**
   * 백업 데이터 DB로 복원
   */
  private async importBackupData(
    data: BackupData,
    photoBlobs: Map<string, Blob>,
    options: RestoreOptions,
    onProgress?: (progress: RestoreProgress) => void
  ): Promise<{ plants: number; photos: number; taskRules: number; taskEvents: number }> {
    const results = { plants: 0, photos: 0, taskRules: 0, taskEvents: 0 };

    // 기존 데이터 삭제 (덮어쓰기 옵션)
    if (options.overwriteExisting) {
      if (onProgress) {
        onProgress({ stage: "importing", message: "기존 데이터 정리 중...", progress: 65 });
      }

      await this.clearExistingData();
    }

    // 식물 데이터 복원
    onProgress?.({ stage: "importing", message: "식물 데이터 복원 중...", progress: 70 });
    for (const plant of data.plants) {
      await this.storage.upsertPlant(plant);
      results.plants++;
    }

    // 작업 규칙 복원
    onProgress?.({ stage: "importing", message: "작업 규칙 복원 중...", progress: 80 });
    for (const rule of data.taskRules) {
      await this.storage.upsertTaskRule(rule);
      results.taskRules++;
    }

    // 작업 이벤트 복원
    onProgress?.({ stage: "importing", message: "작업 기록 복원 중...", progress: 90 });
    for (const event of data.taskEvents) {
      await this.storage.logTaskEvent(event);
      results.taskEvents++;
    }

    // 사진 데이터 복원 (있는 경우)
    if (data.photos && data.photos.length > 0) {
      onProgress?.({ stage: "importing", message: "사진 데이터 복원 중...", progress: 90 });

      for (const photo of data.photos) {
        try {
          // 사진 메타데이터 저장
          await this.storage.upsertPhoto(photo);

          // 사진 Blob 저장 (있는 경우)
          const photoBlob = photoBlobs.get(photo.id);
          if (photoBlob) {
            await this.media.saveBlob(photo.id, photoBlob);
          }

          results.photos++;
        } catch (error) {
          console.warn(`사진 ${photo.id} 복원 실패:`, error);
        }
      }
    }

    return results;
  }

  /**
   * 기존 데이터베이스 데이터 모두 삭제
   */
  private async clearExistingData(): Promise<void> {
    // IndexedDB 데이터 삭제
    const db = (this.storage as any).db; // StorageRepository에서 db 접근
    if (db) {
      const tx = db.transaction(["plants", "taskRules", "taskEvents", "photos"], "readwrite");

      await Promise.all([
        tx.objectStore("plants").clear(),
        tx.objectStore("taskRules").clear(),
        tx.objectStore("taskEvents").clear(),
        tx.objectStore("photos").clear(),
      ]);

      await tx.done;
    }

    // MediaStore 데이터 삭제 (photos_blobs)
    await this.media.clearAll?.();
  }
}
