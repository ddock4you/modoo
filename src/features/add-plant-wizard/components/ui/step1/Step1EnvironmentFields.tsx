import { Info } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Step1FormValues } from "@/features/add-plant-wizard/model";

interface Step1EnvironmentFieldsProps {
  form: UseFormReturn<Step1FormValues>;
}

export function Step1EnvironmentFields({ form }: Step1EnvironmentFieldsProps) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label>요구 습도(%)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="최저 습도"
            {...form.register("humidityMin")}
          />
          <span className="text-sm text-[#3A3431] shrink-0">%</span>
          <span className="text-xs text-neutral-400 shrink-0">~</span>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="최고 습도"
            {...form.register("humidityMax")}
          />
          <span className="text-sm text-[#3A3431] shrink-0">%</span>
        </div>
        {(form.formState.errors.humidityMin || form.formState.errors.humidityMax) && (
          <p className="text-xs text-destructive">
            {form.formState.errors.humidityMin?.message ?? form.formState.errors.humidityMax?.message}
          </p>
        )}
        <div className="flex items-start gap-1 break-keep">
          <Info className="shrink-0 size-5 text-white" fill="#989593" />
          <p className="text-sm text-[#585452] leading-relaxed">
            최저 또는 최고 습도만 있는 경우, 해당 습도만 입력한 후 이상 또는 이하를 선택해주세요.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>요구 온도(℃)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="최저 온도"
            {...form.register("temperatureMin")}
          />
          <span className="text-sm text-[#3A3431] shrink-0">º</span>
          <span className="text-xs text-neutral-400 shrink-0">~</span>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="최고 온도"
            {...form.register("temperatureMax")}
          />
          <span className="text-sm text-[#3A3431] shrink-0">º</span>
        </div>
        {(form.formState.errors.temperatureMin || form.formState.errors.temperatureMax) && (
          <p className="text-xs text-destructive">
            {form.formState.errors.temperatureMin?.message ??
              form.formState.errors.temperatureMax?.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>요구 채광량</Label>
        <Select
          value={form.watch("lightLevel") || "none"}
          onValueChange={(value) =>
            form.setValue("lightLevel", value === "none" ? null : (value as "low" | "medium" | "high"))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="요구 채광량을 선택해주세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">선택 없음</SelectItem>
            <SelectItem value="low">적은 요구함</SelectItem>
            <SelectItem value="medium">보통 요구함</SelectItem>
            <SelectItem value="high">많이 요구함</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-start gap-1 break-keep">
          <Info className="shrink-0 size-5 text-white" fill="#989593" />
          <p className="text-sm text-[#585452] leading-relaxed">
            양지 식물은 많이 요구함, 반양지 식물은 보통 요구함, 음지 식물은 적게 요구함을 선택해주세요.
          </p>
        </div>
      </div>
    </>
  );
}
