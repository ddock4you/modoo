import { useAddPlantWizardActions, useAddPlantWizardState } from "@/lib/plants/add-plant-wizard/hooks";
import {
  AlertDialog,
  AlertDialogContent,
} from "@/components/ui/alert-dialog";
import { Step1Form } from "./ui/Step1Form";
import { Step2Calendar } from "./ui/Step2Calendar";
import { Step3Photos } from "./ui/Step3Photos";
import { usePlantWizardMutation } from "@/features/add-plant-wizard/api/usePlantWizardMutation";
import { useStep1Wizard } from "@/features/add-plant-wizard/hooks/useStep1Wizard";
import { useStep2Wizard } from "@/features/add-plant-wizard/hooks/useStep2Wizard";
import { useStep3Wizard } from "@/features/add-plant-wizard/hooks/useStep3Wizard";
import type { AddPlantWizardStep } from "@/lib/plants/add-plant-wizard/AddPlantWizardTypes";
import { WizardProgress } from "./ui/WizardProgress";
import { WizardStepHeader } from "./ui/WizardStepHeader";

export function AddPlantWizard() {
  const state = useAddPlantWizardState();
  const { close, setStep, reset } = useAddPlantWizardActions();
  const step1Wizard = useStep1Wizard();
  const step2Wizard = useStep2Wizard();
  const step3Wizard = useStep3Wizard();

  const closeWithReset = () => {
    resetAllForms();
    close();
  };

  const mutation = usePlantWizardMutation({
    onSuccess: (result) => {
      if (result.photoUpload && result.photoUpload.failed > 0) {
        const names = result.photoUpload.failedNames.slice(0, 3).join(", ");
        const more = result.photoUpload.failedNames.length > 3 ? "..." : "";
        alert(
          `사진 ${result.photoUpload.failed}장 저장에 실패했어요.\n` +
            `나중에 사진을 다시 추가할 수 있어요.\n` +
            `실패한 파일: ${names}${more}`
        );
      }

      resetAllForms();
      reset();
      close();
    },
    onError: (error) => {
      alert(
        error instanceof Error
          ? error.message
          : "식물 등록 중 오류가 발생했습니다. 다시 시도해주세요."
      );
    },
  });

  const resetAllForms = () => {
    step1Wizard.resetForm();
  };

  const moveToStep3 = () => {
    step2Wizard.handleSubmit();
    setStep(3);
  };

  const handleComplete = () => {
    if (!state.step1) return;

    mutation.mutate({
      step1: state.step1,
      step2: state.step2,
      step3: state.step3,
    });
  };

  const currentStep = state.step;

  return (
    <AlertDialog open={state.isOpen}>
      <AlertDialogContent className="h-full rounded-none relative overflow-y-auto">
        <WizardProgress
          currentStep={currentStep}
          onBack={() => setStep((currentStep - 1) as AddPlantWizardStep)}
          onClose={closeWithReset}
        />
        <div className="">
          <WizardStepHeader step={currentStep} />
          <div className="">
            {currentStep === 1 && (
              <Step1Form form={step1Wizard.form} onSubmit={step1Wizard.handleSubmit(() => setStep(2))} />
            )}

            {currentStep === 2 && (
              <Step2Calendar
                wateredDates={step2Wizard.wateredDates}
                onDateSelect={step2Wizard.handleDateSelect}
                onRemoveDate={step2Wizard.removeDate}
                onSubmit={moveToStep3}
              />
            )}

            {currentStep === 3 && (
              <Step3Photos
                files={step3Wizard.files}
                coverIndex={step3Wizard.coverIndex}
                onFilesSelected={step3Wizard.handleFilesSelected}
                onCoverSelect={step3Wizard.handleCoverSelect}
                onSubmit={handleComplete}
                disabled={mutation.isPending}
              />
            )}
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
