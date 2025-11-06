import exifr from "exifr";
import type { MediaStore } from "./MediaStore";
import { OPFS_PATHS, THUMBNAIL_CONFIG, SUPPORTED_IMAGE_TYPES } from "./MediaStore";
import type { PhotoMeta } from "../../domain/types";
import { generateId } from "../../domain/types";

// Pica 타입 선언 (외부 라이브러리)
import Pica from "pica";

/**
 * OPFS(Origin Private File System) 기반 미디어 저장소 구현체
 */
export class OPFSMediaStore implements MediaStore {
  private rootHandle: FileSystemDirectoryHandle | null = null;
  private pica: any;

  constructor() {
    this.pica = new Pica({ features: ["js", "wasm", "cib"] });
  }

  /**
   * OPFS 초기화 및 디렉토리 구조 생성
   */
  async initialize(): Promise<void> {
    try {
      // OPFS 루트 디렉토리 획득
      this.rootHandle = await navigator.storage.getDirectory();

      // 미디어 디렉토리 구조 생성
      await this.ensureDirectory(OPFS_PATHS.ORIGINALS);
      await this.ensureDirectory(OPFS_PATHS.THUMBS);

      console.log("OPFS initialized successfully");
    } catch (error) {
      console.error("Failed to initialize OPFS:", error);
      throw new Error("OPFS 초기화 실패");
    }
  }

  /**
   * 디렉토리가 존재하지 않으면 생성
   */
  private async ensureDirectory(path: string): Promise<void> {
    if (!this.rootHandle) throw new Error("OPFS not initialized");

    const segments = path.split("/").filter(Boolean);
    let currentHandle: FileSystemDirectoryHandle = this.rootHandle;

    for (const segment of segments) {
      try {
        currentHandle = await currentHandle.getDirectoryHandle(segment, { create: true });
      } catch (error) {
        console.error(`Failed to create directory ${path}:`, error);
        throw error;
      }
    }
  }

  /**
   * 사진 파일 저장 및 메타데이터 생성
   */
  async savePhoto(file: File, plantId: string): Promise<PhotoMeta> {
    if (!this.rootHandle) throw new Error("OPFS not initialized");

    // 파일 타입 검증
    if (!this.isSupportedImageType(file.type)) {
      throw new Error(`지원되지 않는 파일 형식: ${file.type}`);
    }

    const photoId = generateId();
    const now = Date.now();

    // 원본 파일 경로
    const originalPath = `${OPFS_PATHS.ORIGINALS}/${photoId}.jpg`;

    try {
      // EXIF 메타데이터 추출
      const exif = await exifr.parse(file);

      // 원본 파일 저장
      await this.saveFile(originalPath, file);

      // 썸네일 생성
      const thumbnailUri = await this.createThumbnail(originalPath, photoId);

      // PhotoMeta 생성
      const photoMeta: PhotoMeta = {
        id: photoId,
        plantId,
        uri: originalPath,
        thumbUri: thumbnailUri,
        width: exif?.ImageWidth || 0,
        height: exif?.ImageHeight || 0,
        size: file.size,
        createdAt: now,
        updatedAt: now,
      };

      return photoMeta;
    } catch (error) {
      console.error("Failed to save photo:", error);
      // 실패 시 저장된 파일 정리
      try {
        await this.remove(originalPath, "");
      } catch (cleanupError) {
        console.warn("Failed to cleanup after save error:", cleanupError);
      }
      throw error;
    }
  }

  /**
   * 썸네일 생성
   */
  async createThumbnail(originalUri: string, photoId: string): Promise<string> {
    if (!this.rootHandle) throw new Error("OPFS not initialized");

    const thumbnailPath = `${OPFS_PATHS.THUMBS}/${photoId}.jpg`;

    try {
      // 원본 파일 읽기
      const originalFile = await this.getFile(originalUri);
      const img = new Image();
      img.src = URL.createObjectURL(originalFile);

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // 캔버스 생성 및 리사이징
      const canvas = document.createElement("canvas");

      // 최대 크기 계산 (종횡비 유지)
      const maxSize = THUMBNAIL_CONFIG.MAX_SIZE;
      const ratio = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      // Pica로 고품질 리사이징
      const resizedCanvas = await this.pica.resize(img, canvas, {
        quality: THUMBNAIL_CONFIG.QUALITY,
        alpha: false,
        unsharpAmount: 80,
        unsharpRadius: 0.6,
        unsharpThreshold: 2,
      });

      // JPEG로 변환
      const blob = await this.pica.toBlob(
        resizedCanvas,
        THUMBNAIL_CONFIG.FORMAT,
        THUMBNAIL_CONFIG.QUALITY
      );

      // 썸네일 파일 저장
      await this.saveBlob(thumbnailPath, blob);

      // 메모리 정리
      URL.revokeObjectURL(img.src);

      return thumbnailPath;
    } catch (error) {
      console.error("Failed to create thumbnail:", error);
      throw new Error("썸네일 생성 실패");
    }
  }

  /**
   * 파일 URL 생성
   */
  async getUrl(uri: string): Promise<string> {
    if (!this.rootHandle) throw new Error("OPFS not initialized");

    try {
      const file = await this.getFile(uri);
      return URL.createObjectURL(file);
    } catch (error) {
      console.error("Failed to get file URL:", error);
      throw new Error("파일 URL 생성 실패");
    }
  }

  /**
   * 파일 및 썸네일 삭제
   */
  async remove(uri: string, thumbUri: string): Promise<void> {
    if (!this.rootHandle) throw new Error("OPFS not initialized");

    const paths = [uri, thumbUri].filter(Boolean);

    for (const path of paths) {
      try {
        await this.deleteFile(path);
      } catch (error) {
        console.warn(`Failed to delete ${path}:`, error);
      }
    }
  }

  /**
   * 파일 타입 지원 여부 확인
   */
  private isSupportedImageType(mimeType: string): boolean {
    return (SUPPORTED_IMAGE_TYPES as readonly string[]).includes(mimeType);
  }

  /**
   * OPFS 파일 저장 (File 객체)
   */
  private async saveFile(path: string, file: File): Promise<void> {
    const segments = path.split("/").filter(Boolean);
    const fileName = segments.pop()!;
    const dirPath = "/" + segments.join("/");

    const dirHandle = await this.getDirectoryHandle(dirPath);
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();

    await writable.write(file);
    await writable.close();
  }

  /**
   * OPFS 파일 저장 (Blob 객체)
   */
  private async saveBlob(path: string, blob: Blob): Promise<void> {
    const segments = path.split("/").filter(Boolean);
    const fileName = segments.pop()!;
    const dirPath = "/" + segments.join("/");

    const dirHandle = await this.getDirectoryHandle(dirPath);
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();

    await writable.write(blob);
    await writable.close();
  }

  /**
   * OPFS 파일 읽기
   */
  private async getFile(path: string): Promise<File> {
    const segments = path.split("/").filter(Boolean);
    const fileName = segments.pop()!;
    const dirPath = "/" + segments.join("/");

    const dirHandle = await this.getDirectoryHandle(dirPath);
    const fileHandle = await dirHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();

    return file;
  }

  /**
   * OPFS 파일 삭제
   */
  private async deleteFile(path: string): Promise<void> {
    const segments = path.split("/").filter(Boolean);
    const fileName = segments.pop()!;
    const dirPath = "/" + segments.join("/");

    const dirHandle = await this.getDirectoryHandle(dirPath);
    await dirHandle.removeEntry(fileName);
  }

  /**
   * 디렉토리 핸들 획득 (재귀적으로 생성)
   */
  private async getDirectoryHandle(path: string): Promise<FileSystemDirectoryHandle> {
    if (!this.rootHandle) throw new Error("OPFS not initialized");

    if (path === "/") return this.rootHandle;

    const segments = path.split("/").filter(Boolean);
    let currentHandle: FileSystemDirectoryHandle = this.rootHandle;

    for (const segment of segments) {
      currentHandle = await currentHandle.getDirectoryHandle(segment, { create: true });
    }

    return currentHandle;
  }
}
