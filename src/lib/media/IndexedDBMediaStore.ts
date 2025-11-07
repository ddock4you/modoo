import exifr from "exifr";
import imageCompression from "browser-image-compression";
import type { MediaStore } from "./MediaStore";
import { THUMBNAIL_CONFIG, SUPPORTED_IMAGE_TYPES } from "./MediaStore";
import type { PhotoMeta } from "../../domain/types";
import { generateId } from "../../domain/types";
import { getDB } from "../storage/db";

// 원본 이미지 압축 설정
const getOriginalCompressionOptions = (onProgress?: (progress: number) => void) =>
  ({
    maxSizeMB: 2, // 최대 2MB
    maxWidthOrHeight: 1920, // 최대 1920px (Full HD)
    useWebWorker: true, // Web Worker 사용으로 성능 향상
    initialQuality: 0.85, // 85% 품질
    fileType: "image/webp", // WebP 포맷 (더 효율적)
    preserveExif: false, // EXIF 메타데이터 제거로 용량 절감
    onProgress, // 진행률 콜백
  } as const);

/**
 * IndexedDB Blob 기반 미디어 저장소 구현체
 * IndexedDB에 Blob을 직접 저장하여 브라우저 호환성 확보
 */
export class IndexedDBMediaStore implements MediaStore {
  constructor() {
    // browser-image-compression 사용으로 별도 초기화 불필요
  }

  /**
   * IndexedDB 초기화 (실제로는 DB 연결만 확인)
   */
  async initialize(): Promise<void> {
    try {
      // DB 연결 확인
      const db = getDB();
      if (!db) {
        throw new Error("Database not initialized");
      }

      // photos_blobs 스토어가 존재하는지 확인
      const storeNames = Array.from(db.objectStoreNames);
      if (!storeNames.includes("photos_blobs")) {
        throw new Error("photos_blobs store not found in database");
      }

      console.log("IndexedDB Media Store initialized successfully");
    } catch (error) {
      console.error("Failed to initialize IndexedDB Media Store:", error);
      throw new Error("IndexedDB 미디어 저장소 초기화 실패");
    }
  }

  /**
   * 썸네일 생성 (인터페이스 구현용 - 실제로는 내부적으로 처리)
   */
  async createThumbnail(_originalUri: string, _photoId: string): Promise<string> {
    // IndexedDB 방식에서는 내부적으로 Blob을 생성하므로
    // 이 메서드는 호환성을 위해 존재
    throw new Error("createThumbnail is not used in IndexedDB storage");
  }

  /**
   * 사진 파일 저장 및 메타데이터 생성
   */
  async savePhoto(
    file: File,
    plantId: string,
    onProgress?: (progress: number) => void
  ): Promise<PhotoMeta> {
    const db = getDB();
    if (!db) throw new Error("Database not initialized");

    // 파일 타입 검증
    if (!this.isSupportedImageType(file.type)) {
      throw new Error(`지원되지 않는 파일 형식: ${file.type}`);
    }

    const photoId = generateId();
    const now = Date.now();

    try {
      // 압축 전 원본 파일에서 EXIF 메타데이터 추출 (안전하게)
      let exif: any = {};
      try {
        exif = await exifr.parse(file);
      } catch (exifError) {
        console.warn("Failed to parse EXIF from original file, using defaults:", exifError);
        // EXIF 파싱 실패 시 기본값 사용
      }

      // 원본 이미지 압축
      const compressedFile = await imageCompression(
        file,
        getOriginalCompressionOptions(onProgress)
      );

      // 썸네일 생성 (압축된 이미지를 기반으로)
      const thumbnailBlob = await this.createThumbnailBlob(compressedFile);

      // PhotoMeta 생성
      const photoMeta: PhotoMeta = {
        id: photoId,
        plantId,
        uri: `blob:${photoId}:original`, // Blob 식별자 (실제로는 사용되지 않음)
        thumbUri: `blob:${photoId}:thumbnail`, // Blob 식별자
        width: exif?.ImageWidth || 0,
        height: exif?.ImageHeight || 0,
        size: file.size,
        createdAt: now,
        updatedAt: now,
      };

      // IndexedDB에 Blob 데이터 저장
      const blobData = {
        id: photoId,
        plantId,
        originalBlob: compressedFile, // 압축된 파일 저장
        thumbnailBlob,
        metadata: photoMeta,
        createdAt: now,
      };

      await db.put("photos_blobs", blobData);

      return photoMeta;
    } catch (error) {
      console.error("Failed to save photo:", error);
      throw error;
    }
  }

  /**
   * 썸네일 Blob 생성
   */
  private async createThumbnailBlob(originalFile: File): Promise<Blob> {
    try {
      // browser-image-compression으로 썸네일 생성
      const thumbnailFile = await imageCompression(originalFile, {
        maxWidthOrHeight: THUMBNAIL_CONFIG.MAX_SIZE, // 최대 512px (종횡비 유지)
        useWebWorker: true, // Web Worker 사용으로 성능 향상
        fileType: THUMBNAIL_CONFIG.FORMAT, // JPEG 포맷
        initialQuality: THUMBNAIL_CONFIG.QUALITY, // 80% 품질
        preserveExif: false, // EXIF 제거로 용량 절감
      });

      return thumbnailFile;
    } catch (error) {
      console.error("Failed to create thumbnail:", error);
      throw new Error("썸네일 생성 실패");
    }
  }

  /**
   * 원본 사진 Blob 가져오기
   */
  async getBlob(photoId: string): Promise<Blob> {
    const db = getDB();
    if (!db) throw new Error("Database not initialized");

    try {
      const record = await db.get("photos_blobs", photoId);
      if (!record) {
        throw new Error(`Photo not found: ${photoId}`);
      }

      return record.originalBlob;
    } catch (error) {
      console.error("Failed to get photo blob:", error);
      throw new Error("사진 데이터를 가져올 수 없습니다");
    }
  }

  /**
   * 사진 Blob 직접 저장 (복원용)
   */
  async saveBlob(photoId: string, blob: Blob): Promise<void> {
    const db = getDB();
    if (!db) throw new Error("Database not initialized");

    try {
      // 복원용 기본 메타데이터 생성
      const now = Date.now();
      const blobData = {
        id: photoId,
        plantId: "", // 복원 시에는 나중에 업데이트됨
        originalBlob: blob,
        thumbnailBlob: blob, // 임시로 원본 사용 (썸네일 생성은 나중에)
        metadata: {
          id: photoId,
          plantId: "",
          uri: `blob:${photoId}`,
          thumbUri: `thumb:${photoId}`,
          width: 0, // 복원 시에는 이미지 분석을 하지 않음
          height: 0,
          size: blob.size,
          createdAt: now,
          updatedAt: now,
        } as any, // 타입 단언으로 임시 해결
        createdAt: now,
      };

      await db.put("photos_blobs", blobData);
    } catch (error) {
      console.error("Failed to save photo blob:", error);
      throw new Error("사진 데이터를 저장할 수 없습니다");
    }
  }

  /**
   * 모든 데이터 삭제 (복원용)
   */
  async clearAll(): Promise<void> {
    const db = getDB();
    if (!db) throw new Error("Database not initialized");

    try {
      const tx = db.transaction("photos_blobs", "readwrite");
      await tx.objectStore("photos_blobs").clear();
      await tx.done;
    } catch (error) {
      console.error("Failed to clear media store:", error);
      throw new Error("미디어 저장소 정리 실패");
    }
  }

  /**
   * Blob URL 생성
   */
  async getUrl(photoId: string): Promise<string> {
    const db = getDB();
    if (!db) throw new Error("Database not initialized");

    try {
      const record = await db.get("photos_blobs", photoId);
      if (!record) {
        throw new Error(`Photo not found: ${photoId}`);
      }

      // Blob URL 생성
      return URL.createObjectURL(record.originalBlob);
    } catch (error) {
      console.error("Failed to get blob URL:", error);
      throw new Error("Blob URL 생성 실패");
    }
  }

  /**
   * 썸네일 URL 생성
   */
  async getThumbnailUrl(photoId: string): Promise<string> {
    const db = getDB();
    if (!db) throw new Error("Database not initialized");

    try {
      const record = await db.get("photos_blobs", photoId);
      if (!record) {
        throw new Error(`Photo not found: ${photoId}`);
      }

      // 썸네일 Blob URL 생성
      return URL.createObjectURL(record.thumbnailBlob);
    } catch (error) {
      console.error("Failed to get thumbnail URL:", error);
      throw new Error("썸네일 URL 생성 실패");
    }
  }

  /**
   * 사진 및 썸네일 삭제
   */
  async remove(photoId: string, _thumbUri: string): Promise<void> {
    const db = getDB();
    if (!db) throw new Error("Database not initialized");

    try {
      await db.delete("photos_blobs", photoId);
    } catch (error) {
      console.warn(`Failed to delete photo ${photoId}:`, error);
    }
  }

  /**
   * 파일 타입 지원 여부 확인
   */
  private isSupportedImageType(mimeType: string): boolean {
    return (SUPPORTED_IMAGE_TYPES as readonly string[]).includes(mimeType);
  }
}
