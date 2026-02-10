import type { StorageRepository } from "../storage/StorageRepository";
import type { MediaStore } from "../media/MediaStore";
import type {
  BackupService,
  BackupOptions,
  BackupProgress,
  BackupResult,
  BackupMetadata,
  RestoreOptions,
  RestoreProgress,
  RestoreResult,
} from "./types";
import { createBackupFile } from "./createBackup";
import { restoreBackupFromFile } from "./restoreBackup";
import { validateBackupFile } from "./validateBackup";

/**
 * 백업/복원 서비스 구현체 (IndexedDB + MediaStore)
 */
export class IndexedDbBackupService implements BackupService {
  private storage: StorageRepository;
  private media: MediaStore;

  constructor(storage: StorageRepository, media: MediaStore) {
    this.storage = storage;
    this.media = media;
  }

  createBackup(
    options: BackupOptions = { includePhotos: true },
    onProgress?: (progress: BackupProgress) => void
  ): Promise<BackupResult> {
    return createBackupFile(this.storage, this.media, options, onProgress);
  }

  restoreBackup(
    file: File,
    options: RestoreOptions = { mode: "merge" },
    onProgress?: (progress: RestoreProgress) => void
  ): Promise<RestoreResult> {
    return restoreBackupFromFile(this.storage, this.media, file, options, onProgress);
  }

  validateBackup(
    file: File
  ): Promise<{ valid: boolean; metadata?: BackupMetadata; error?: string }> {
    return validateBackupFile(file);
  }
}
