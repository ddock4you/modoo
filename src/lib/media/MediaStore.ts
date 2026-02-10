import type { PhotoMeta } from "../../domain/types";

/**
 * 미디어 저장소 인터페이스
 * IndexedDB를 활용한 사진 저장/관리
 */
export interface MediaStore {
  /**
   * 미디어 스토어 초기화
   * IndexedDB 스토어 생성 및 설정
   */
  initialize(): Promise<void>;

  /**
   * 사진 파일을 저장하고 메타데이터를 반환
   * @param file 사진 파일
   * @param plantId 식물 ID
   * @param onProgress 진행률 콜백 함수 (0-100)
   * @returns 생성된 PhotoMeta
   */
  savePhoto(
    file: File,
    plantId: string,
    onProgress?: (progress: number) => void
  ): Promise<PhotoMeta>;

  /**
   * 원본 사진 URL 생성
   * @param photoId 사진 ID
   * @returns 브라우저에서 접근 가능한 URL
   */
  getUrl(photoId: string): Promise<string>;

  /**
   * 원본 사진 Blob 가져오기
   * @param photoId 사진 ID
   * @returns 사진 Blob 데이터
   */
  getBlob(photoId: string): Promise<Blob>;

  /**
   * 사진 Blob 직접 저장 (복원용)
   * @param photoId 사진 ID
   * @param blob 사진 Blob 데이터
   */
  saveBlob(photoId: string, blob: Blob): Promise<void>;

  /**
   * 썸네일 URL 생성
   * @param photoId 사진 ID
   * @returns 브라우저에서 접근 가능한 썸네일 URL
   */
  getThumbnailUrl(photoId: string): Promise<string>;

  /**
   * 사진 및 썸네일 삭제
   * @param photoId 사진 ID
   * @param thumbUri 썸네일 URI (하위 호환성용)
   */
  remove(photoId: string, thumbUri?: string): Promise<void>;

  /**
   * 저장소 정리 (사용하지 않는 파일 삭제)
   * 추후 구현 예정
   */
  cleanup?(): Promise<void>;

  /**
   * 모든 데이터 삭제 (복원용)
   */
  clearAll?(): Promise<void>;
}

/**
 * 썸네일 설정
 */
export const THUMBNAIL_CONFIG = {
  MAX_SIZE: 512, // 최대 너비/높이 (px)
  QUALITY: 0.8, // JPEG 품질 (0-1)
  FORMAT: "image/jpeg" as const,
} as const;

/**
 * 지원되는 이미지 포맷
 */
export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;
