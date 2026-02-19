import { ArrowLeft } from "lucide-react";
import { AlertDialogCancel } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { AddPlantWizardStep } from "@/lib/plants/add-plant-wizard/AddPlantWizardTypes";

interface WizardProgressProps {
  currentStep: AddPlantWizardStep;
  onBack: () => void;
  onClose: () => void;
}

const WIZARD_STEPS: ReadonlyArray<{ step: AddPlantWizardStep; label: string }> = [
  { step: 1, label: "식물 정보" },
  { step: 2, label: "물주기 정보 입력" },
  { step: 3, label: "대표 사진 등록" },
] as const;

export function WizardProgress({ currentStep, onBack, onClose }: WizardProgressProps) {
  return (
    <div className="relative flex items-center justify-center py-4 px-7">
      {currentStep !== 1 && (
        <button type="button" onClick={onBack}>
          <ArrowLeft className="w-6 h-6 absolute left-0 top-1/2 -translate-y-1/2" />
        </button>
      )}

      <ul className="flex items-center justify-center gap-2">
        {WIZARD_STEPS.map(({ step, label }) => (
          <li key={step} className="flex items-center gap-2">
            <span
              className={cn(
                "flex w-5 h-5 items-center justify-center rounded-full bg-[#AEAEAE] text-xs font-bold text-white",
                currentStep === step && "bg-[#5B5958]"
              )}
            >
              {step}
            </span>
            {currentStep === step && <span className="text-sm text-[#5B5958] font-bold">{label}</span>}
          </li>
        ))}
      </ul>

      <AlertDialogCancel
        onClick={onClose}
        aria-label="닫기"
        className="absolute right-0 top-1/2 -translate-y-1/2"
      >
        ✕
      </AlertDialogCancel>
    </div>
  );
}
