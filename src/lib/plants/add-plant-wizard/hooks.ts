import { useContext, useMemo } from "react";
import { AddPlantWizardActionsContext, AddPlantWizardStateContext, type AddPlantWizardActions } from "./context";
import type { AddPlantWizardState } from "./state";

export function useAddPlantWizardState(): AddPlantWizardState {
  const state = useContext(AddPlantWizardStateContext);
  if (!state) {
    throw new Error("useAddPlantWizardState는 AddPlantWizardProvider 안에서만 사용할 수 있습니다.");
  }
  return state;
}

export function useAddPlantWizardActions(): AddPlantWizardActions {
  const actions = useContext(AddPlantWizardActionsContext);
  if (!actions) {
    throw new Error("useAddPlantWizardActions는 AddPlantWizardProvider 안에서만 사용할 수 있습니다.");
  }
  return actions;
}

// Backward-compatible convenience hook. Prefer splitting state/actions for fewer rerenders.
export function useAddPlantWizard() {
  const state = useAddPlantWizardState();
  const actions = useAddPlantWizardActions();
  return useMemo(() => ({ state, ...actions }), [state, actions]);
}
