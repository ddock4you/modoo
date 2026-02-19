import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PhotoMeta } from "@/domain/types";
import { PLANTS_QK } from "@/features/plants/api/queryKeys";
import type { StorageRepository } from "@/lib/storage/StorageRepository";
import { usePlantWizardMutation } from "./usePlantWizardMutation";

const mockUseStorage = vi.fn();
const mockUseMedia = vi.fn();

vi.mock("@/lib/storage/useStorage", () => ({
  useStorage: () => mockUseStorage(),
}));

vi.mock("@/lib/media/useMedia", () => ({
  useMedia: () => mockUseMedia(),
}));

function createStorageMock(): Pick<StorageRepository, "upsertPlant" | "upsertTaskRule" | "logTaskEvent" | "upsertPhoto"> {
  return {
    upsertPlant: vi.fn().mockResolvedValue(undefined),
    upsertTaskRule: vi.fn().mockResolvedValue(undefined),
    logTaskEvent: vi.fn().mockResolvedValue(undefined),
    upsertPhoto: vi.fn().mockResolvedValue(undefined),
  };
}

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function createPhotoMeta(id: string, plantId: string): PhotoMeta {
  const now = Date.now();
  return {
    id,
    plantId,
    uri: `${id}-uri`,
    thumbUri: `${id}-thumb`,
    width: 640,
    height: 480,
    size: 1024,
    createdAt: now,
    updatedAt: now,
  };
}

describe("usePlantWizardMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("사진 부분 실패 시 실패 목록을 반환하고 첫 성공 사진을 대표로 사용한다", async () => {
    const storage = createStorageMock();
    const savePhoto = vi
      .fn<
        (file: File, plantId: string) => Promise<PhotoMeta>
      >()
      .mockImplementation(async (file, plantId) => {
        if (file.name.includes("bad")) {
          throw new Error("upload failed");
        }
        return createPhotoMeta("photo-ok", plantId);
      });

    mockUseStorage.mockReturnValue(storage);
    mockUseMedia.mockReturnValue({ savePhoto });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => usePlantWizardMutation(), {
      wrapper: createWrapper(queryClient),
    });

    const good = new File(["good"], "good.jpg", { type: "image/jpeg" });
    const bad = new File(["bad"], "bad.jpg", { type: "image/jpeg" });

    const data = await result.current.mutateAsync({
      step1: {
        name: "몬스테라",
        adoptedDate: "2026-02-18",
        intervalDays: 7,
        isSensitive: false,
        humidityMin: undefined,
        humidityMax: undefined,
        temperatureMin: undefined,
        temperatureMax: undefined,
        lightLevel: null,
      },
      step2: { wateredDates: ["2026-02-17"] },
      step3: { files: [good, bad], coverIndex: 1 },
    });

    expect(data.coverPhotoId).toBe("photo-ok");
    expect(data.photoUpload).toEqual({
      uploaded: 1,
      failed: 1,
      failedNames: ["bad.jpg"],
    });

    expect(storage.upsertPhoto).toHaveBeenCalledTimes(1);
    expect(storage.upsertPlant).toHaveBeenCalledTimes(2);

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: PLANTS_QK.list() });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: PLANTS_QK.taskRules() });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: PLANTS_QK.dueTasks() });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: PLANTS_QK.statusAll() });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: PLANTS_QK.statusStats() });
  });

  it("media가 없으면 사진 저장 없이 식물/규칙/이벤트만 저장한다", async () => {
    const storage = createStorageMock();
    mockUseStorage.mockReturnValue(storage);
    mockUseMedia.mockReturnValue(null);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const { result } = renderHook(() => usePlantWizardMutation(), {
      wrapper: createWrapper(queryClient),
    });

    const photo = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    const data = await result.current.mutateAsync({
      step1: {
        name: "스킨답서스",
        adoptedDate: null,
        intervalDays: 5,
        isSensitive: true,
        humidityMin: 30,
        humidityMax: 60,
        temperatureMin: 18,
        temperatureMax: 28,
        lightLevel: "medium",
      },
      step2: { wateredDates: [] },
      step3: { files: [photo], coverIndex: 0 },
    });

    expect(data.coverPhotoId).toBeNull();
    expect(data.photoUpload).toBeUndefined();

    expect(storage.upsertPhoto).toHaveBeenCalledTimes(0);
    expect(storage.upsertPlant).toHaveBeenCalledTimes(1);
  });
});
