import { z } from "zod";
import type { BackupData } from "./types";

const plantSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    adoptedAt: z.number(),
    humidity: z
      .object({
        min: z.number(),
        max: z.number(),
      })
      .nullable(),
    temperature: z
      .object({
        min: z.number(),
        max: z.number(),
      })
      .nullable(),
    lightLevel: z.enum(["low", "medium", "high"]).nullable(),
    isSensitive: z.boolean(),
    notes: z.string(),
    coverPhotoUri: z.string(),
    createdAt: z.number(),
    updatedAt: z.number(),
  })
  .passthrough();

const taskRuleSchema = z
  .object({
    id: z.string(),
    plantId: z.string(),
    type: z.literal("water"),
    intervalDays: z.number(),
    lastDoneAt: z.number().nullable(),
    nextDueAt: z.number(),
    note: z.string(),
    active: z.union([z.literal(0), z.literal(1)]),
    createdAt: z.number(),
    updatedAt: z.number(),
  })
  .passthrough();

const taskEventSchema = z
  .object({
    id: z.string(),
    plantId: z.string(),
    type: z.literal("water"),
    doneAt: z.number(),
    note: z.string(),
    createdAt: z.number(),
  })
  .passthrough();

const photoMetaSchema = z
  .object({
    id: z.string(),
    plantId: z.string(),
    uri: z.string(),
    thumbUri: z.string(),
    width: z.number(),
    height: z.number(),
    size: z.number(),
    createdAt: z.number(),
    updatedAt: z.number(),
    displayWidth: z.number().optional(),
    displayHeight: z.number().optional(),
    aspectRatio: z.number().optional(),
    cropArea: z
      .object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
      })
      .optional(),
  })
  .passthrough();

const settingSchema = z
  .object({
    key: z.string(),
    value: z.string(),
    createdAt: z.number(),
    updatedAt: z.number(),
  })
  .passthrough();

const backupDataSchema = z
  .object({
    version: z.string(),
    timestamp: z.string(),
    appVersion: z.string().default("unknown"),
    plants: z.array(plantSchema),
    taskRules: z.array(taskRuleSchema),
    taskEvents: z.array(taskEventSchema),
    photos: z.array(photoMetaSchema).default([]),
    settings: z.array(settingSchema).default([]),
  })
  .passthrough();

export function parseBackupData(input: unknown): BackupData {
  return backupDataSchema.parse(input);
}

export function safeParseBackupData(input: unknown):
  | { success: true; data: BackupData }
  | { success: false; error: string } {
  const result = backupDataSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues.map((i) => i.message).join("; "),
    };
  }
  return { success: true, data: result.data };
}
