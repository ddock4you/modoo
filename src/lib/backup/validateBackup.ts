import type { BackupMetadata } from "./types";
import { parseBackupData } from "./schema";
import { buildMetadata } from "./utils";

export async function validateBackupFile(
  file: File
): Promise<{ valid: boolean; metadata?: BackupMetadata; error?: string }> {
  try {
    const isZip = file.type === "application/zip" || file.name.endsWith(".zip");

    if (isZip) {
      const { default: JSZip } = await import("jszip");
      const zip = await JSZip.loadAsync(file);

      const metadataFile = zip.file("metadata.json");
      if (metadataFile) {
        const metadataText = await metadataFile.async("string");
        const metadata: BackupMetadata = JSON.parse(metadataText);
        return { valid: true, metadata };
      }

      const backupFile = zip.file("backup.json");
      if (!backupFile) {
        return { valid: false, error: "유효하지 않은 ZIP: backup.json이 없습니다" };
      }
      const jsonText = await backupFile.async("string");
      const data = parseBackupData(JSON.parse(jsonText) as unknown);
      return { valid: true, metadata: buildMetadata(data) };
    }

    const text = await file.text();
    const data = parseBackupData(JSON.parse(text) as unknown);
    return { valid: true, metadata: buildMetadata(data) };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "파일 검증 실패",
    };
  }
}
