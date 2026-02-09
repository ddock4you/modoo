import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Step1FormValues } from "@/features/add-plant-wizard/model";
import { cn } from "@/lib/utils";
import AddPlantIllustration from "@/assets/illustrations/illust1.png";
import { Info, Calendar } from "lucide-react";

interface Step1FormProps {
  form: UseFormReturn<Step1FormValues>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
}

export function Step1Form({ form, onSubmit }: Step1FormProps) {
  return (
    <div className="px-7 pt-5 pb-9 bg-[#EEF8F5] rounded-b-[20px]">
      <form onSubmit={onSubmit} className="flex flex-col gap-5 bg-white p-6 rounded-xl">
        <div className="flex flex-col gap-2">
          <Label>
            식물 이름<span className="text-[#FF4400]">*</span>
          </Label>
          <Input {...form.register("name")} placeholder="이름을 입력해주세요." />
          {form.formState.errors.name && (
            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label>키우기 시작한 날짜</Label>
          <div className="relative">
            <input
              type="date"
              {...form.register("adoptedDate")}
              className="border-input data-placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-sm border bg-transparent px-3 py-3 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 min-h-12 text-[#3A3431] appearance-none"
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 size-4 opacity-50 pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>
            물주기 주기<span className="text-[#FF4400]">*</span>
          </Label>
          <Select
            value={form.watch("intervalDays")?.toString() || ""}
            onValueChange={(value) => form.setValue("intervalDays", Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="물주기 주기를 선택해주세요" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                <SelectItem key={d} value={d.toString()}>
                  {d}일에 한 번
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.intervalDays && (
            <p className="text-xs text-destructive">{form.formState.errors.intervalDays.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2  border-b border-dashed pb-4">
          <Label>예민함 여부</Label>
          <div className="flex gap-3">
            <button
              type="button"
              className={cn(
                "flex-1 rounded-sm border break-keep text-sm transition flex flex-col items-center gap-2 font-medium px-5 py-3",
                form.watch("isSensitive")
                  ? "border-emerald-500 bg-white text-emerald-700 shadow-sm"
                  : "border-neutral-200 bg-white text-neutral-700"
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
                !form.watch("isSensitive")
                  ? "border-emerald-500 bg-white text-emerald-700 shadow-sm"
                  : "border-neutral-200 bg-white text-neutral-700"
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
              {form.formState.errors.humidityMin?.message ??
                form.formState.errors.humidityMax?.message}
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
              form.setValue(
                "lightLevel",
                value === "none" ? null : (value as "low" | "medium" | "high")
              )
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
              양지 식물은 많이 요구함, 반양지 식물은 보통 요구함, 음지 식물은 적게 요구함을
              선택해주세요.
            </p>
          </div>
        </div>

        <Button type="submit" className="h-12 w-full rounded-sm bg-[#00A576] font-bold text-base">
          식물 정보 등록 완료
        </Button>
      </form>
    </div>
  );
}
