import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Blob as NodeBlob } from "buffer";

import { initDB } from "@/infrastructure/storage/db";

const createThumbnailBlobMock = vi.fn<(original: Blob) => Promise<Blob>>();
const readImageDimensionsMock = vi.fn<(blob: Blob) => Promise<{ width: number; height: number }>>();

vi.mock("./thumbnail", () => ({
  createThumbnailBlob: (original: Blob) => createThumbnailBlobMock(original),
}));

vi.mock("./imageDimensions", () => ({
  readImageDimensions: (blob: Blob) => readImageDimensionsMock(blob),
}));

describe("IndexedDbMediaStore.saveBlob", () => {
  beforeEach(async () => {
    createThumbnailBlobMock.mockReset();
    readImageDimensionsMock.mockReset();

    const db = await initDB();
    await db.clear("photos");
    await db.clear("photos_blobs");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses persisted PhotoMeta to keep plantId/createdAt and regenerates thumbnail", async () => {
    const db = await initDB();
    const { IndexedDbMediaStore } = await import("./IndexedDbMediaStore");

    const photoId = "photo_test_1";
    await db.put("photos", {
      id: photoId,
      plantId: "plant_1",
      uri: "idb:photo_test_1:original",
      thumbUri: "idb:photo_test_1:thumb",
      width: 400,
      height: 300,
      size: 999,
      createdAt: 111,
      updatedAt: 222,
    });

    createThumbnailBlobMock.mockResolvedValue(
      new NodeBlob(["t"], { type: "image/jpeg" }) as unknown as Blob
    );
    readImageDimensionsMock.mockResolvedValue({ width: 1, height: 2 });

    const store = new IndexedDbMediaStore();
    await store.initialize();

    const original = new NodeBlob([new Uint8Array([1, 2, 3, 4])], {
      type: "image/webp",
    }) as unknown as Blob;
    await store.saveBlob(photoId, original);

    const record = await db.get("photos_blobs", photoId);
    expect(record).toBeTruthy();

    expect(record!.plantId).toBe("plant_1");
    expect(record!.createdAt).toBe(111);

    expect(record!.metadata.plantId).toBe("plant_1");
    expect(record!.metadata.createdAt).toBe(111);
    expect(record!.metadata.updatedAt).toBe(222);
    expect(record!.metadata.width).toBe(400);
    expect(record!.metadata.height).toBe(300);
    expect(record!.metadata.size).toBe((original as any).size);

    expect(createThumbnailBlobMock).toHaveBeenCalledTimes(1);
    expect(readImageDimensionsMock).toHaveBeenCalledTimes(0);

    expect(typeof (record!.thumbnailBlob as any)?.size).toBe("number");
    expect((record!.thumbnailBlob as any).size).toBeGreaterThan(0);
  });

  it("falls back to derived dimensions and uses original blob when thumbnail generation fails", async () => {
    const now = 1704067200000;
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(now);

    const db = await initDB();
    const { IndexedDbMediaStore } = await import("./IndexedDbMediaStore");

    const photoId = "photo_test_2";
    const original = new NodeBlob(["original"], { type: "image/png" }) as unknown as Blob;

    createThumbnailBlobMock.mockRejectedValue(new Error("thumbnail failed"));
    readImageDimensionsMock.mockResolvedValue({ width: 111, height: 222 });

    const store = new IndexedDbMediaStore();
    await store.initialize();

    await store.saveBlob(photoId, original);

    const record = await db.get("photos_blobs", photoId);
    expect(record).toBeTruthy();

    expect(record!.plantId).toBe("");
    expect(record!.createdAt).toBe(now);

    expect(record!.metadata.width).toBe(111);
    expect(record!.metadata.height).toBe(222);
    expect(record!.metadata.createdAt).toBe(now);

    expect(readImageDimensionsMock).toHaveBeenCalledTimes(1);
    expect(createThumbnailBlobMock).toHaveBeenCalledTimes(1);

    // When thumbnail generation fails, store uses original blob as thumbnail fallback.
    expect(typeof (record!.thumbnailBlob as any)?.size).toBe("number");
    expect((record!.thumbnailBlob as any).size).toBe((original as any).size);

    nowSpy.mockRestore();
  });
});
