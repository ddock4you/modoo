import type { PhotoMeta } from "../../domain/types";
import type { MediaStore } from "./MediaStore";

export class UnsupportedMediaStore implements MediaStore {
  private readonly reason: string;

  constructor(reason?: string) {
    this.reason = reason ?? "Media store is not available";
  }

  async initialize(): Promise<void> {
    // noop
  }

  async savePhoto(_file: File, _plantId: string, _onProgress?: (progress: number) => void): Promise<PhotoMeta> {
    throw new Error(this.reason);
  }

  async getUrl(_photoId: string): Promise<string> {
    throw new Error(this.reason);
  }

  async getBlob(_photoId: string): Promise<Blob> {
    throw new Error(this.reason);
  }

  async saveBlob(_photoId: string, _blob: Blob): Promise<void> {
    throw new Error(this.reason);
  }

  async getThumbnailUrl(_photoId: string): Promise<string> {
    throw new Error(this.reason);
  }

  async remove(_photoId: string, _thumbUri?: string): Promise<void> {
    // allow UI to proceed even if media is unavailable
  }
}
