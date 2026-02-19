import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Step3Photos } from "./Step3Photos";

const mockUseObjectUrls = vi.fn();

vi.mock("@/features/add-plant-wizard/hooks/useObjectUrls", () => ({
  useObjectUrls: (files: readonly File[]) => mockUseObjectUrls(files),
}));

describe("Step3Photos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("파일 선택 시 onFilesSelected를 호출한다", async () => {
    const user = userEvent.setup();
    const onFilesSelected = vi.fn();
    mockUseObjectUrls.mockReturnValue([]);

    render(
      <Step3Photos
        files={[]}
        coverIndex={null}
        onFilesSelected={onFilesSelected}
        onCoverSelect={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["photo"], "leaf.png", { type: "image/png" });

    await user.upload(input, file);

    expect(onFilesSelected).toHaveBeenCalledTimes(1);
    const firstCallArg = onFilesSelected.mock.calls[0]?.[0] as FileList | null;
    expect(firstCallArg?.[0]?.name).toBe("leaf.png");
  });

  it("대표 사진 클릭 시 onCoverSelect를 호출한다", async () => {
    const user = userEvent.setup();
    const onCoverSelect = vi.fn();
    const files = [
      new File(["a"], "a.png", { type: "image/png" }),
      new File(["b"], "b.png", { type: "image/png" }),
    ];
    mockUseObjectUrls.mockReturnValue(["blob://a", "blob://b"]);

    render(
      <Step3Photos
        files={files}
        coverIndex={0}
        onFilesSelected={vi.fn()}
        onCoverSelect={onCoverSelect}
        onSubmit={vi.fn()}
      />
    );

    const imageButtons = screen.getAllByRole("button").filter((button) => {
      return button.querySelector("img[alt='업로드한 사진']") !== null;
    });

    await user.click(imageButtons[1]);

    expect(onCoverSelect).toHaveBeenCalledWith(1);
  });

  it("등록 중 상태에서 제출 버튼이 비활성화되고 문구가 변경된다", () => {
    mockUseObjectUrls.mockReturnValue([]);

    render(
      <Step3Photos
        files={[]}
        coverIndex={null}
        onFilesSelected={vi.fn()}
        onCoverSelect={vi.fn()}
        onSubmit={vi.fn()}
        disabled
      />
    );

    const submitButton = screen.getByRole("button", { name: "등록 중..." });
    expect(submitButton).toBeDisabled();
  });
});
