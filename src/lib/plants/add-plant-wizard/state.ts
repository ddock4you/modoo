import type { AddPlantStep1Data, AddPlantStep2Data, AddPlantStep3Data, AddPlantWizardStep } from "./AddPlantWizardTypes";

export interface AddPlantWizardState {
  isOpen: boolean;
  step: AddPlantWizardStep;
  step1: AddPlantStep1Data | null;
  step2: AddPlantStep2Data;
  step3: AddPlantStep3Data;
}

export function createInitialWizardState(
  overrides: Partial<AddPlantWizardState> = {}
): AddPlantWizardState {
  return {
    isOpen: false,
    step: 1,
    step1: null,
    step2: { wateredDates: [] },
    step3: { files: [], coverIndex: null },
    ...overrides,
  };
}
