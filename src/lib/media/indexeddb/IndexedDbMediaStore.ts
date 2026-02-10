import imageCompression from "browser-image-compression";
import type { IDBPDatabase } from "idb";

import type { PhotoMeta } from "../../../domain/types";
import { initDB, type ModooDB } from "../../storage/db";
import { generateId } from "../../utils/id";
import { SUPPORTED_IMAGE_TYPES, type MediaStore } from "../MediaStore";
import { getOriginalCompressionOptions } from "./compression";
import { readImageDimensions } from "./imageDimensions";
import { createThumbnailBlob } from "./thumbnail";

/**
 * IndexedDB Blob 기반 미디어 저장소 구현체
 * IndexedDB에 Blob을 직접 저장하여 브라우저 호환성 확보
 */
export class IndexedDbMediaStore implements MediaStore {
  private db: IDBPDatabase<ModooDB> | null = null;

  constructor() {
    // browser-image-compression 사용으로 별도 초기화 불필요
  }

  private async getDb(): Promise<IDBPDatabase<ModooDB>> {
    if (this.db) return this.db;
    this.db = await initDB();
    return this.db;
  }

  /**
   * IndexedDB 초기화 (실제로는 DB 연결만 확인)
   */
  async initialize(): Promise<void> {
    try {
      const db = await this.getDb();

      const storeNames = Array.from(db.objectStoreNames);
      if (!storeNames.includes("photos_blobs")) {
        throw new Error("photos_blobs store not found in database");
      }
    } catch (error) {
      console.error("Failed to initialize IndexedDB Media Store:", error);
      throw new Error("IndexedDB 미디어 저장소 초기화 실패");
    }
  }

  /**
   * 사진 파일 저장 및 메타데이터 생성
   */
  async savePhoto(
    file: File,
    plantId: string,
    onProgress?: (progress: number) => void
  ): Promise<PhotoMeta> {
    const db = await this.getDb();

    if (!this.isSupportedImageType(file.type)) {
      throw new Error(`지원되지 않는 파일 형식: ${file.type}`);
    }

    const photoId = generateId();
    const now = Date.now();

    try {
      const compressedFile = await imageCompression(file, getOriginalCompressionOptions(onProgress));

      const [thumbnailBlob, dims] = await Promise.all([
        createThumbnailBlob(compressedFile),
        readImageDimensions(compressedFile),
      ]);

      const photoMeta: PhotoMeta = {
        id: photoId,
        plantId,
        uri: `blob:${photoId}:original`,
        thumbUri: `blob:${photoId}:thumbnail`,
        width: dims.width,
        height: dims.height,
        size: compressedFile.size,
        createdAt: now,
        updatedAt: now,
      };

      const blobData = {
        id: photoId,
        plantId,
        originalBlob: compressedFile,
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

  async getBlob(photoId: string): Promise<Blob> {
    const db = await this.getDb();

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

  async saveBlob(photoId: string, blob: Blob): Promise<void> {
    const db = await this.getDb();

    try {
      const now = Date.now();

      // Restore path writes PhotoMeta first (photos store) and blob second.
      // Prefer persisted meta so photos_blobs indexes (byPlantId/byCreatedAt) stay meaningful.
      const persisted = await db.get("photos", photoId);

      const dims =
        persisted && persisted.width > 0 && persisted.height > 0
          ? { width: persisted.width, height: persisted.height }
          : await readImageDimensions(blob);

      let thumbnailBlob: Blob;
      try {
        thumbnailBlob = await createThumbnailBlob(blob);
      } catch (error) {
        console.warn(`Failed to create thumbnail for ${photoId}; falling back to original blob`, error);
        thumbnailBlob = blob;
      }

      const photoMeta: PhotoMeta = {
        id: photoId,
        plantId: persisted?.plantId ?? "",
        uri: persisted?.uri ?? `blob:${photoId}:original`,
        thumbUri: persisted?.thumbUri ?? `blob:${photoId}:thumbnail`,
        width: dims.width,
        height: dims.height,
        size: blob.size,
        createdAt: persisted?.createdAt ?? now,
        updatedAt: persisted?.updatedAt ?? now,
        displayWidth: persisted?.displayWidth,
        displayHeight: persisted?.displayHeight,
        aspectRatio: persisted?.aspectRatio,
        cropArea: persisted?.cropArea,
      };

      const blobData = {
        id: photoId,
        plantId: photoMeta.plantId,
        originalBlob: blob,
        thumbnailBlob,
        metadata: photoMeta,
        createdAt: photoMeta.createdAt,
      };

      await db.put("photos_blobs", blobData);
    } catch (error) {
      console.error("Failed to save photo blob:", error);
      throw new Error("사진 데이터를 저장할 수 없습니다");
    }
  }

  async clearAll(): Promise<void> {
    const db = await this.getDb();

    try {
      const tx = db.transaction("photos_blobs", "readwrite");
      await tx.objectStore("photos_blobs").clear();
      await tx.done;
    } catch (error) {
      console.error("Failed to clear media store:", error);
      throw new Error("미디어 저장소 정리 실패");
    }
  }

  async getUrl(photoId: string): Promise<string> {
    const db = await this.getDb();

    try {
      const record = await db.get("photos_blobs", photoId);
      if (!record) {
        throw new Error(`Photo not found: ${photoId}`);
      }

      return URL.createObjectURL(record.originalBlob);
    } catch (error) {
      console.error("Failed to get blob URL:", error);
      throw new Error("Blob URL 생성 실패");
    }
  }

  async getThumbnailUrl(photoId: string): Promise<string> {
    const db = await this.getDb();

    try {
      const record = await db.get("photos_blobs", photoId);
      if (!record) {
        throw new Error(`Photo not found: ${photoId}`);
      }

      return URL.createObjectURL(record.thumbnailBlob);
    } catch (error) {
      console.error("Failed to get thumbnail URL:", error);
      throw new Error("썸네일 URL 생성 실패");
    }
  }

  async remove(photoId: string, _thumbUri?: string): Promise<void> {
    const db = await this.getDb();

    try {
      await db.delete("photos_blobs", photoId);
    } catch (error) {
      console.warn(`Failed to delete photo ${photoId}:`, error);
    }
  }

  private isSupportedImageType(mimeType: string): boolean {
    return (SUPPORTED_IMAGE_TYPES as readonly string[]).includes(mimeType);
  }
}
