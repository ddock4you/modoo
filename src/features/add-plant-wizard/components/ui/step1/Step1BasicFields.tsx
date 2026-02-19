import { Calendar } from "lucide-react";
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

interface Step1BasicFieldsProps {
  form: UseFormReturn<Step1FormValues>;
}

export function Step1BasicFields({ form }: Step1BasicFieldsProps) {
  return (
    <>
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
            {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
              <SelectItem key={day} value={day.toString()}>
                {day}일에 한 번
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.intervalDays && (
          <p className="text-xs text-destructive">{form.formState.errors.intervalDays.message}</p>
        )}
      </div>
    </>
  );
}
