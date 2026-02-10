import { useCallback, useMemo, useState, type ReactNode } from "react";
import type { AddPlantStep1Data, AddPlantStep2Data, AddPlantStep3Data, AddPlantWizardStep } from "./AddPlantWizardTypes";
import { AddPlantWizardActionsContext, AddPlantWizardStateContext, type AddPlantWizardActions } from "./context";
import { createInitialWizardState, type AddPlantWizardState } from "./state";

export function AddPlantWizardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AddPlantWizardState>(() => createInitialWizardState());

  const open = useCallback((step?: AddPlantWizardStep) => {
    setState((prev) => ({
      ...prev,
      isOpen: true,
      step: step ?? prev.step,
    }));
  }, []);

  const close = useCallback(() => {
    setState(createInitialWizardState());
  }, []);

  const setStep = useCallback((step: AddPlantWizardStep) => {
    setState((prev) => ({ ...prev, step }));
  }, []);

  const setStep1 = useCallback((data: AddPlantStep1Data) => {
    setState((prev) => ({ ...prev, step1: data }));
  }, []);

  const setStep2 = useCallback((data: AddPlantStep2Data) => {
    setState((prev) => ({ ...prev, step2: data }));
  }, []);

  const setStep3 = useCallback((updater: (prev: AddPlantStep3Data) => AddPlantStep3Data) => {
    setState((prev) => ({ ...prev, step3: updater(prev.step3) }));
  }, []);

  const reset = useCallback(() => {
    setState((prev) => createInitialWizardState({ isOpen: prev.isOpen }));
  }, []);

  const actions = useMemo<AddPlantWizardActions>(
    () => ({ open, close, setStep, setStep1, setStep2, setStep3, reset }),
    [open, close, setStep, setStep1, setStep2, setStep3, reset]
  );

  return (
    <AddPlantWizardStateContext.Provider value={state}>
      <AddPlantWizardActionsContext.Provider value={actions}>
        {children}
      </AddPlantWizardActionsContext.Provider>
    </AddPlantWizardStateContext.Provider>
  );
}
