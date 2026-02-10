import type { Plant, TaskRule, TaskEvent, PhotoMeta, SettingKV } from "../../domain/types";

/**
 * 백업 데이터 구조
 */
export interface BackupData {
  version: string;
  timestamp: string;
  appVersion: string;
  plants: Plant[];
  taskRules: TaskRule[];
  taskEvents: TaskEvent[];
  photos: PhotoMeta[];
  settings: SettingKV[];
}

/**
 * 백업 메타데이터
 */
export interface BackupMetadata {
  version: string;
  created: string;
  appVersion: string;
  totalPlants: number;
  totalPhotos: number;
  totalTaskRules: number;
  totalTaskEvents: number;
  compressedSize?: number;
}

/**
 * 백업 진행 상태
 */
export interface BackupProgress {
  stage: "preparing" | "exporting" | "compressing" | "downloading" | "complete";
  message: string;
  progress: number; // 0-100
  currentItem?: string;
}

/**
 * 복원 진행 상태
 */
export interface RestoreProgress {
  stage: "uploading" | "extracting" | "validating" | "importing" | "complete";
  message: string;
  progress: number; // 0-100
  currentItem?: string;
}

/**
 * 백업 옵션
 */
export interface BackupOptions {
  includePhotos: boolean;
  filename?: string;
  /**
   * 백업 파일 내부 메타데이터에 기록할 앱 버전(표시용)
   * 빌드 시스템과 연동되기 전까지는 선택적으로 받습니다.
   */
  appVersion?: string;
}

/**
 * 복원 옵션
 */
export interface RestoreOptions {
  /**
   * overwrite: 기존 데이터를 모두 지우고 백업 데이터로 교체
   * merge: 기존 데이터 유지 + 백업 데이터를 upsert(동일 id는 덮어쓰기)
   */
  mode: "overwrite" | "merge";
  skipValidation?: boolean;
}

/**
 * 백업/복원 결과
 */
export interface BackupResult {
  success: boolean;
  blob?: Blob;
  filename?: string;
  size?: number;
  format?: "json" | "zip";
  error?: string;
  metadata?: BackupMetadata;
}

export interface RestoreResult {
  success: boolean;
  restoredItems?: {
    plants: number;
    photos: number;
    taskRules: number;
    taskEvents: number;
  };
  skippedItems?: number;
  error?: string;
}

/**
 * 백업 서비스 인터페이스
 */
export interface BackupService {
  /**
   * 전체 데이터 백업 생성
   */
  createBackup(
    options?: BackupOptions,
    onProgress?: (progress: BackupProgress) => void
  ): Promise<BackupResult>;

  /**
   * 백업 파일에서 데이터 복원
   */
  restoreBackup(
    file: File,
    options?: RestoreOptions,
    onProgress?: (progress: RestoreProgress) => void
  ): Promise<RestoreResult>;

  /**
   * 백업 파일 검증
   */
  validateBackup(
    file: File
  ): Promise<{ valid: boolean; metadata?: BackupMetadata; error?: string }>;
}
