import { createContext } from "react";
import type { AddPlantStep1Data, AddPlantStep2Data, AddPlantStep3Data, AddPlantWizardStep } from "./AddPlantWizardTypes";
import type { AddPlantWizardState } from "./state";

export interface AddPlantWizardActions {
  open: (step?: AddPlantWizardStep) => void;
  close: () => void;
  setStep: (step: AddPlantWizardStep) => void;
  setStep1: (data: AddPlantStep1Data) => void;
  setStep2: (data: AddPlantStep2Data) => void;
  setStep3: (updater: (prev: AddPlantStep3Data) => AddPlantStep3Data) => void;
  reset: () => void;
}

export const AddPlantWizardStateContext = createContext<AddPlantWizardState | null>(null);
export const AddPlantWizardActionsContext = createContext<AddPlantWizardActions | null>(null);
