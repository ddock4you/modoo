import type { BackupData, BackupMetadata } from "./types";

export function dateStamp(): string {
  return new Date().toISOString().split("T")[0] ?? "unknown";
}

export function buildMetadata(data: BackupData, compressedSize?: number): BackupMetadata {
  return {
    version: data.version,
    created: data.timestamp,
    appVersion: data.appVersion,
    totalPlants: data.plants.length,
    totalPhotos: data.photos.length,
    totalTaskRules: data.taskRules.length,
    totalTaskEvents: data.taskEvents.length,
    compressedSize,
  };
}
