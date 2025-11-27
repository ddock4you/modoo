/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type {
  AddPlantStep1Data,
  AddPlantStep2Data,
  AddPlantStep3Data,
  AddPlantWizardStep,
} from "./AddPlantWizardTypes";

export interface AddPlantWizardState {
  isOpen: boolean;
  step: AddPlantWizardStep;
  step1: AddPlantStep1Data | null;
  step2: AddPlantStep2Data | null;
  step3: AddPlantStep3Data | null;
}

interface AddPlantWizardContextValue {
  state: AddPlantWizardState;
  open: (step?: AddPlantWizardStep) => void;
  close: () => void;
  setStep: (step: AddPlantWizardStep) => void;
  setStep1: (data: AddPlantStep1Data) => void;
  setStep2: (data: AddPlantStep2Data) => void;
  setStep3: (updater: (prev: AddPlantStep3Data) => AddPlantStep3Data) => void;
  reset: () => void;
}

const AddPlantWizardContext = createContext<AddPlantWizardContextValue | null>(null);

function AddPlantWizardProviderInner({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AddPlantWizardState>(() => ({
    isOpen: false,
    step: 1,
    step1: null,
    step2: { wateredDates: [] },
    step3: { files: [], coverIndex: null },
  }));

  const open = useCallback((step?: AddPlantWizardStep) => {
    setState((prev) => ({
      ...prev,
      isOpen: true,
      step: step ?? prev.step ?? 1,
    }));
  }, []);

  const close = useCallback(() => {
    setState({
      isOpen: false,
      step: 1,
      step1: null,
      step2: { wateredDates: [] },
      step3: { files: [], coverIndex: null },
    });
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
    setState((prev) => ({
      ...prev,
      step3: updater(prev.step3 ?? { files: [], coverIndex: null }),
    }));
  }, []);

  const reset = useCallback(() => {
    setState((prev) => ({
      step: 1,
      step1: null,
      step2: { wateredDates: [] },
      step3: { files: [], coverIndex: null },
      isOpen: prev.isOpen,
    }));
  }, []);

  const value = useMemo<AddPlantWizardContextValue>(
    () => ({
      state,
      open,
      close,
      setStep,
      setStep1,
      setStep2,
      setStep3,
      reset,
    }),
    [state, open, close, setStep, setStep1, setStep2, setStep3, reset]
  );

  return <AddPlantWizardContext.Provider value={value}>{children}</AddPlantWizardContext.Provider>;
}

export function AddPlantWizardProvider({ children }: { children: ReactNode }) {
  return <AddPlantWizardProviderInner>{children}</AddPlantWizardProviderInner>;
}

export function useAddPlantWizard() {
  const ctx = useContext(AddPlantWizardContext);
  if (!ctx) {
    throw new Error("useAddPlantWizard는 AddPlantWizardProvider 안에서만 사용할 수 있습니다.");
  }
  return ctx;
}
