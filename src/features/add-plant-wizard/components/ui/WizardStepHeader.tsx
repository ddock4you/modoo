import AddPlantIllustration from "@/assets/illustrations/illust1.png";
import { AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { AddPlantWizardStep } from "@/lib/plants/add-plant-wizard/AddPlantWizardTypes";

interface WizardStepHeaderProps {
  step: AddPlantWizardStep;
}

export function WizardStepHeader({ step }: WizardStepHeaderProps) {
  return (
    <>
      <img src={AddPlantIllustration} alt="" className="mx-auto" aria-hidden="true" />
      <AlertDialogHeader className="relative pt-9 pb-0 px-7 bg-[#EEF8F5] rounded-t-[20px]">
        <AlertDialogTitle className="text-center text-xl font-bold text-[#3A3431]">
          {step === 1 && "식물 정보를 입력해주세요."}
          {step === 2 && "최근 물을 준 날을 선택해주세요."}
          {step === 3 && "식물의 대표 사진을 등록해주세요."}
        </AlertDialogTitle>
        <AlertDialogDescription className="text-center sr-only">
          {step === 1 && "식물의 기본 정보를 입력하여 새로운 식물을 등록하세요."}
          {step === 2 && "물 준 날짜가 기억나지 않아도 괜찮아요. 나중에 언제든지 추가할 수 있어요."}
          {step === 3 &&
            "등록할 사진이 없어도 식물을 등록할 수 있어요. 나중에 언제든지 추가할 수 있어요."}
        </AlertDialogDescription>
      </AlertDialogHeader>
    </>
  );
}
