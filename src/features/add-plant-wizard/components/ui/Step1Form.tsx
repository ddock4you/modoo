import type { UseFormReturn } from "react-hook-form";
import type { BaseSyntheticEvent } from "react";
import { Button } from "@/components/ui/button";
import { type Step1FormValues } from "@/features/add-plant-wizard/model";
import { Step1BasicFields } from "./step1/Step1BasicFields";
import { Step1EnvironmentFields } from "./step1/Step1EnvironmentFields";
import { Step1SensitivityField } from "./step1/Step1SensitivityField";

interface Step1FormProps {
  form: UseFormReturn<Step1FormValues>;
  onSubmit: (e?: BaseSyntheticEvent) => Promise<void>;
}

export function Step1Form({ form, onSubmit }: Step1FormProps) {
  return (
    <div className="px-7 pt-5 pb-9 bg-[#EEF8F5] rounded-b-[20px]">
      <form onSubmit={onSubmit} className="flex flex-col gap-5 bg-white p-6 rounded-xl">
        <Step1BasicFields form={form} />
        <Step1SensitivityField form={form} />
        <Step1EnvironmentFields form={form} />

        <Button type="submit" className="h-12 w-full rounded-sm bg-[#00A576] font-bold text-base">
          식물 정보 등록 완료
        </Button>
      </form>
    </div>
  );
}
