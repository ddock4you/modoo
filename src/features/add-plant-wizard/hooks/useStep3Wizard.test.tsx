import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStep3Wizard } from "./useStep3Wizard";

const mockUseAddPlantWizardState = vi.fn();
const mockUseAddPlantWizardActions = vi.fn();
const mockGetImageSize = vi.fn();

vi.mock("@/providers/useAddPlantWizard", () => ({
  useAddPlantWizardState: () => mockUseAddPlantWizardState(),
  useAddPlantWizardActions: () => mockUseAddPlantWizardActions(),
}));

vi.mock("../utils/imageUtils", () => ({
  getImageSize: (file: File) => mockGetImageSize(file),
}));

function toFileList(files: File[]): FileList {
  const fileList = {
    length: files.length,
    item: (index: number) => files[index] ?? null,
    [Symbol.iterator]: function* iterator() {
      for (const file of files) {
        yield file;
      }
    },
  } as FileList;

  files.forEach((file, index) => {
    Object.defineProperty(fileList, index, {
      value: file,
      enumerable: true,
      configurable: true,
    });
  });

  return fileList;
}

describe("useStep3Wizard", () => {
  const setStep3 = vi.fn();
  const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAddPlantWizardActions.mockReturnValue({ setStep3 });
    mockUseAddPlantWizardState.mockReturnValue({
      isOpen: true,
      step3: { files: [], coverIndex: null },
    });
  });

  it("유효한 이미지 파일만 추가하고 context를 동기화한다", async () => {
    const valid = new File(["valid"], "valid.jpg", { type: "image/jpeg" });
    mockGetImageSize.mockResolvedValue({ width: 360, height: 320 });

    const { result } = renderHook(() => useStep3Wizard());

    await act(async () => {
      await result.current.handleFilesSelected(toFileList([valid]));
    });

    await waitFor(() => {
      expect(result.current.files).toHaveLength(1);
    });
    expect(result.current.files[0]?.name).toBe("valid.jpg");

    const latestUpdater = setStep3.mock.calls.at(-1)?.[0] as
      | ((prev: { files: File[]; coverIndex: number | null }) => {
          files: File[];
          coverIndex: number | null;
        })
      | undefined;
    expect(latestUpdater).toBeTypeOf("function");

    const next = latestUpdater?.({ files: [], coverIndex: null });
    expect(next?.files).toHaveLength(1);
    expect(next?.coverIndex).toBeNull();
  });

  it("350px 미만 이미지면 경고 후 추가하지 않는다", async () => {
    const small = new File(["small"], "small.jpg", { type: "image/jpeg" });
    mockGetImageSize.mockResolvedValue({ width: 300, height: 340 });

    const { result } = renderHook(() => useStep3Wizard());

    await act(async () => {
      await result.current.handleFilesSelected(toFileList([small]));
    });

    expect(result.current.files).toHaveLength(0);
    expect(alertSpy).toHaveBeenCalledWith("350픽셀 이상의 이미지만 등록할 수 있어요.");
  });

  it("대표 사진 선택 시 coverIndex를 업데이트한다", async () => {
    const existing = new File(["existing"], "existing.jpg", { type: "image/jpeg" });
    mockUseAddPlantWizardState.mockReturnValue({
      isOpen: true,
      step3: { files: [existing], coverIndex: null },
    });

    const { result } = renderHook(() => useStep3Wizard());

    act(() => {
      result.current.handleCoverSelect(0);
    });

    await waitFor(() => {
      expect(result.current.coverIndex).toBe(0);
    });

    const latestUpdater = setStep3.mock.calls.at(-1)?.[0] as
      | ((prev: { files: File[]; coverIndex: number | null }) => {
          files: File[];
          coverIndex: number | null;
        })
      | undefined;
    const next = latestUpdater?.({ files: [existing], coverIndex: null });
    expect(next?.coverIndex).toBe(0);
  });
});
