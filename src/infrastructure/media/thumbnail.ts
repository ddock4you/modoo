import imageCompression from "browser-image-compression";
import { THUMBNAIL_CONFIG } from "@/lib/media/MediaStore";

function toFile(blob: Blob): File {
  if (blob instanceof File) return blob;
  const type = blob.type || "image/jpeg";
  return new File([blob], "photo", { type });
}

export async function createThumbnailBlob(original: Blob): Promise<Blob> {
  try {
    const thumbnailFile = await imageCompression(toFile(original), {
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
