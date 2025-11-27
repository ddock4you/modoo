import { z } from "zod";

export const step1Schema = z.object({
  name: z.string().min(1, "식물 이름을 입력해주세요."),
  adoptedDate: z.string().optional().nullable(),
  intervalDays: z.coerce
    .number()
    .int()
    .min(1, "물주기 주기는 1일 이상이어야 합니다.")
    .max(30, "물주기 주기는 30일 이하여야 합니다."),
  isSensitive: z.boolean(),
  humidityMin: z
    .union([z.coerce.number().min(0).max(100), z.nan()])
    .optional()
    .transform((v) => (Number.isNaN(v) ? undefined : v)),
  humidityMax: z
    .union([z.coerce.number().min(0).max(100), z.nan()])
    .optional()
    .transform((v) => (Number.isNaN(v) ? undefined : v)),
  temperatureMin: z
    .union([z.coerce.number().min(-20).max(50), z.nan()])
    .optional()
    .transform((v) => (Number.isNaN(v) ? undefined : v)),
  temperatureMax: z
    .union([z.coerce.number().min(-20).max(50), z.nan()])
    .optional()
    .transform((v) => (Number.isNaN(v) ? undefined : v)),
  lightLevel: z
    .union([z.literal("low"), z.literal("medium"), z.literal("high"), z.literal("none"), z.null()])
    .transform((v) => (v === "none" || v === null ? null : v)),
});

export type Step1FormValues = z.infer<typeof step1Schema>;
