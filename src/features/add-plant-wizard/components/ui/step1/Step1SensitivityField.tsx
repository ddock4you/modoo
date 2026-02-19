import { Info } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import AddPlantIllustration from "@/assets/illustrations/illust1.png";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Step1FormValues } from "@/features/add-plant-wizard/model";

interface Step1SensitivityFieldProps {
  form: UseFormReturn<Step1FormValues>;
}

export function Step1SensitivityField({ form }: Step1SensitivityFieldProps) {
  const isSensitive = form.watch("isSensitive");

  return (
    <div className="flex flex-col gap-2 border-b border-dashed pb-4">
      <Label>예민함 여부</Label>
      <div className="flex gap-3">
        <button
          type="button"
          className={cn(
            "flex-1 rounded-sm border break-keep text-sm transition flex flex-col items-center gap-2 font-medium px-5 py-3",
            isSensitive ? "border-emerald-500 bg-white text-emerald-700 shadow-sm" : "border-neutral-200 bg-white text-neutral-700"
          )}
          onClick={() => form.setValue("isSensitive", true)}
        >
          <img src={AddPlantIllustration} className="w-12" alt="" aria-hidden="true" />
          예민해요.
        </button>
        <button
          type="button"
          className={cn(
            "flex-1 rounded-sm border break-keep text-sm transition flex flex-col items-center gap-2 font-medium px-5 py-3",
            !isSensitive ? "border-emerald-500 bg-white text-emerald-700 shadow-sm" : "border-neutral-200 bg-white text-neutral-700"
          )}
          onClick={() => form.setValue("isSensitive", false)}
        >
          <img src={AddPlantIllustration} className="w-12" alt="" aria-hidden="true" />
          예민하지 않아요.
        </button>
      </div>
      <div className="flex items-start gap-1 break-keep">
        <Info className="shrink-0 size-5 text-white" fill="#989593" />
        <p className="text-sm text-[#585452] leading-relaxed">
          예민한 식물로 선택할 경우 선택한 물주기 일정보다 2일 전부터 알람을 제공해드려요.
        </p>
      </div>
    </div>
  );
}
