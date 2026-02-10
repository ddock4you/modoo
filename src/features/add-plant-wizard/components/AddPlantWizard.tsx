import { useAddPlantWizardActions, useAddPlantWizardState } from "@/lib/plants/AddPlantWizardContext";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Step1Form } from "./ui/Step1Form";
import { Step2Calendar } from "./ui/Step2Calendar";
import { Step3Photos } from "./ui/Step3Photos";
import { usePlantWizardMutation } from "@/features/add-plant-wizard/hooks/usePlantWizardMutation";
import { useStep1Wizard } from "@/features/add-plant-wizard/hooks/useStep1Wizard";
import { useStep2Wizard } from "@/features/add-plant-wizard/hooks/useStep2Wizard";
import { useStep3Wizard } from "@/features/add-plant-wizard/hooks/useStep3Wizard";
import { ArrowLeft } from "lucide-react";
import type { AddPlantWizardStep } from "@/lib/plants/AddPlantWizardTypes";
import AddPlantIllustration from "@/assets/illustrations/illust1.png";
export function AddPlantWizard() {
  const state = useAddPlantWizardState();
  const { close, setStep, reset } = useAddPlantWizardActions();

  // 모달을 닫고 모든 폼을 초기화하는 함수
  const closeWithReset = () => {
    resetAllForms();
    close();
  };
  const mutation = usePlantWizardMutation({
    onSuccess: (result) => {
      console.log("Plant creation succeeded, closing modal. Result:", result);

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
      console.error("Plant creation failed:", error);
      alert(
        error instanceof Error
          ? error.message
          : "식물 등록 중 오류가 발생했습니다. 다시 시도해주세요."
      );
    },
  });

  // 각 단계별 로직 훅들
  const step1Wizard = useStep1Wizard();
  const step2Wizard = useStep2Wizard();
  const step3Wizard = useStep3Wizard();

  // 모든 폼 초기화 함수
  const resetAllForms = () => {
    step1Wizard.resetForm();
    // step2와 step3는 별도 초기화 로직이 필요 없음 (context에서 처리)
  };

  const handleNextFromStep1 = () => {
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    step2Wizard.handleSubmit();
    setStep(3);
  };

  const handlePreviousFromStep2 = () => {
    setStep(1);
  };

  const handlePreviousFromStep3 = () => {
    setStep(2);
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
  const steps = [
    { step: 1, label: "식물 정보" },
    { step: 2, label: "물주기 정보 입력" },
    { step: 3, label: "대표 사진 등록" },
  ];

  return (
    <AlertDialog open={state.isOpen}>
      <AlertDialogContent className="h-full rounded-none relative overflow-y-auto">
        <div className="relative flex items-center justify-center py-4 px-7">
          {currentStep !== 1 && (
            <button type="button" onClick={() => setStep((currentStep - 1) as AddPlantWizardStep)}>
              <ArrowLeft className="w-6 h-6 absolute left-0 top-1/2 -translate-y-1/2" />
            </button>
          )}
          <ul className="flex items-center justify-center gap-2">
            {steps.map(({ step, label }) => (
              <li key={step} className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex w-5 h-5 items-center justify-center rounded-full bg-[#AEAEAE] text-xs font-bold text-white",
                    currentStep === step && "bg-[#5B5958]"
                  )}
                >
                  {step}
                </span>
                {currentStep === step && (
                  <span className="text-sm text-[#5B5958] font-bold">{label}</span>
                )}
              </li>
            ))}
          </ul>
          <AlertDialogCancel
            onClick={() => {
              closeWithReset();
            }}
            aria-label="닫기"
            className="absolute right-0 top-1/2 -translate-y-1/2"
          >
            ✕
          </AlertDialogCancel>
        </div>
        <div className="">
          <img src={AddPlantIllustration} alt="" className="mx-auto" aria-hidden="true" />
          <AlertDialogHeader className="relative pt-9 pb-0 px-7 bg-[#EEF8F5] rounded-t-[20px]">
            <AlertDialogTitle className="text-center text-xl font-bold text-[#3A3431]">
              {currentStep === 1 && "식물 정보를 입력해주세요."}
              {currentStep === 2 && "최근 물을 준 날을 선택해주세요."}
              {currentStep === 3 && "식물의 대표 사진을 등록해주세요."}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center sr-only">
              {currentStep === 1 && "식물의 기본 정보를 입력하여 새로운 식물을 등록하세요."}
              {currentStep === 2 &&
                "물 준 날짜가 기억나지 않아도 괜찮아요. 나중에 언제든지 추가할 수 있어요."}
              {currentStep === 3 &&
                "등록할 사진이 없어도 식물을 등록할 수 있어요. 나중에 언제든지 추가할 수 있어요."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="">
            {currentStep === 1 && (
              <Step1Form
                form={step1Wizard.form}
                onSubmit={step1Wizard.handleSubmit(handleNextFromStep1)}
              />
            )}

            {currentStep === 2 && (
              <Step2Calendar
                wateredDates={step2Wizard.wateredDates}
                onDateSelect={step2Wizard.handleDateSelect}
                onRemoveDate={step2Wizard.removeDate}
                onSubmit={handleNextFromStep2}
                onPrevious={handlePreviousFromStep2}
              />
            )}

            {currentStep === 3 && (
              <Step3Photos
                files={step3Wizard.files}
                coverIndex={step3Wizard.coverIndex}
                onFilesSelected={step3Wizard.handleFilesSelected}
                onCoverSelect={step3Wizard.handleCoverSelect}
                onSubmit={handleComplete}
                onPrevious={handlePreviousFromStep3}
                disabled={mutation.isPending}
              />
            )}
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
