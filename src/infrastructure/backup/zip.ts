import type { MediaStore } from "@/lib/media/MediaStore";
import type { BackupData, BackupMetadata, BackupProgress, RestoreProgress } from "@/lib/backup/types";
import { parseBackupData } from "@/lib/backup/schema";

function extensionFromMime(mime: string): string {
  switch (mime) {
    case "image/webp":
      return "webp";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    default:
      return "bin";
  }
}

function photoIdFromZipPath(path: string): string {
  const name = path.split("/").pop() ?? path;
  return name.replace(/\.[^.]+$/, "");
}

export async function createZipBackup(params: {
  backupJson: string;
  metadata: BackupMetadata;
  photos: Array<{ id: string }>;
  media: MediaStore;
  onProgress?: (progress: BackupProgress) => void;
}): Promise<Blob> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();

  zip.file("metadata.json", JSON.stringify(params.metadata, null, 2));
  zip.file("backup.json", params.backupJson);

  if (params.photos.length > 0) {
    zip.folder("photos");

    for (let i = 0; i < params.photos.length; i++) {
      const photo = params.photos[i];
      params.onProgress?.({
        stage: "compressing",
        message: `사진 백업 중... (${i + 1}/${params.photos.length})`,
        progress: 50 + (i / params.photos.length) * 40,
        currentItem: photo.id,
      });

      try {
        const blob = await params.media.getBlob(photo.id);
        const ext = extensionFromMime(blob.type);
        zip.file(`photos/${photo.id}.${ext}`, blob);
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

export async function extractZipBackup(
  file: File,
  onProgress?: (progress: RestoreProgress) => void
): Promise<{ data: BackupData; photoBlobs: Map<string, Blob> }> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(file);

  const backupFile = zip.file("backup.json");
  if (!backupFile) {
    throw new Error("유효하지 않은 백업 파일: backup.json이 없습니다");
  }

  onProgress?.({ stage: "extracting", message: "백업 데이터 추출 중...", progress: 25 });
  const jsonText = await backupFile.async("string");
  const raw = JSON.parse(jsonText) as unknown;
  const data = parseBackupData(raw);

  const photoBlobs = new Map<string, Blob>();
  const photosFolder = zip.folder("photos");
  if (photosFolder) {
    const files = Object.values(photosFolder.files).filter((f) => !f.dir);
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      try {
        const photoId = photoIdFromZipPath(f.name);
        const blob = await f.async("blob");
        photoBlobs.set(photoId, blob);
      } catch (error) {
        console.warn(`사진 파일 ${f.name} 추출 실패:`, error);
      }
    }
  }

  return { data, photoBlobs };
}
