import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddPlantWizard } from "./AddPlantWizard";

const mockUseAddPlantWizardState = vi.fn();
const mockUseAddPlantWizardActions = vi.fn();
const mockUseStep1Wizard = vi.fn();
const mockUseStep2Wizard = vi.fn();
const mockUseStep3Wizard = vi.fn();
const mockUsePlantWizardMutation = vi.fn();

vi.mock("@/lib/plants/add-plant-wizard/hooks", () => ({
  useAddPlantWizardState: () => mockUseAddPlantWizardState(),
  useAddPlantWizardActions: () => mockUseAddPlantWizardActions(),
}));

vi.mock("@/features/add-plant-wizard/hooks/useStep1Wizard", () => ({
  useStep1Wizard: () => mockUseStep1Wizard(),
}));

vi.mock("@/features/add-plant-wizard/hooks/useStep2Wizard", () => ({
  useStep2Wizard: () => mockUseStep2Wizard(),
}));

vi.mock("@/features/add-plant-wizard/hooks/useStep3Wizard", () => ({
  useStep3Wizard: () => mockUseStep3Wizard(),
}));

vi.mock("@/features/add-plant-wizard/api/usePlantWizardMutation", () => ({
  usePlantWizardMutation: (options?: {
    onSuccess?: (result: unknown) => void;
    onError?: (error: unknown) => void;
  }) => mockUsePlantWizardMutation(options),
}));

vi.mock("./ui/Step1Form", () => ({
  Step1Form: ({ onSubmit }: { onSubmit: () => void }) => (
    <button type="button" onClick={onSubmit}>
      step1-submit
    </button>
  ),
}));

vi.mock("./ui/Step2Calendar", () => ({
  Step2Calendar: ({ onSubmit }: { onSubmit: () => void }) => (
    <button type="button" onClick={onSubmit}>
      step2-submit
    </button>
  ),
}));

vi.mock("./ui/Step3Photos", () => ({
  Step3Photos: ({ onSubmit }: { onSubmit: () => void }) => (
    <button type="button" onClick={onSubmit}>
      step3-submit
    </button>
  ),
}));

describe("AddPlantWizard", () => {
  const mutate = vi.fn();
  const setStep = vi.fn();
  const close = vi.fn();
  const reset = vi.fn();
  const resetForm = vi.fn();
  const step2Submit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAddPlantWizardActions.mockReturnValue({
      close,
      setStep,
      reset,
    });

    mockUseStep1Wizard.mockReturnValue({
      form: {},
      handleSubmit: (onSuccess?: () => void) => () => onSuccess?.(),
      resetForm,
    });

    mockUseStep2Wizard.mockReturnValue({
      wateredDates: [],
      handleDateSelect: vi.fn(),
      removeDate: vi.fn(),
      handleSubmit: step2Submit,
    });

    mockUseStep3Wizard.mockReturnValue({
      files: [],
      coverIndex: null,
      handleFilesSelected: vi.fn(),
      handleCoverSelect: vi.fn(),
    });

    mockUsePlantWizardMutation.mockReturnValue({
      mutate,
      isPending: false,
    });
  });

  it("step2에서 제출하면 step3로 이동한다", async () => {
    const user = userEvent.setup();

    mockUseAddPlantWizardState.mockReturnValue({
      isOpen: true,
      step: 2,
      step1: { name: "몬스테라" },
      step2: { wateredDates: [] },
      step3: { files: [], coverIndex: null },
    });

    render(<AddPlantWizard />);

    await user.click(screen.getByRole("button", { name: "step2-submit" }));

    expect(step2Submit).toHaveBeenCalledTimes(1);
    expect(setStep).toHaveBeenCalledWith(3);
  });

  it("step3에서 최종 제출하면 mutation에 wizard state를 전달한다", async () => {
    const user = userEvent.setup();
    const state = {
      isOpen: true,
      step: 3,
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
      step2: { wateredDates: ["2026-02-16"] },
      step3: { files: [], coverIndex: null },
    };
    mockUseAddPlantWizardState.mockReturnValue(state);

    render(<AddPlantWizard />);

    await user.click(screen.getByRole("button", { name: "step3-submit" }));

    expect(mutate).toHaveBeenCalledWith({
      step1: state.step1,
      step2: state.step2,
      step3: state.step3,
    });
  });

  it("닫기 버튼 클릭 시 form reset 후 close를 호출한다", async () => {
    const user = userEvent.setup();

    mockUseAddPlantWizardState.mockReturnValue({
      isOpen: true,
      step: 1,
      step1: null,
      step2: { wateredDates: [] },
      step3: { files: [], coverIndex: null },
    });

    render(<AddPlantWizard />);

    await user.click(screen.getByRole("button", { name: "닫기" }));

    expect(resetForm).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });
});
