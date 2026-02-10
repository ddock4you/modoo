import type { Plant } from "@/domain/types";
import { generateId } from "@/lib/utils/id";
import type { TaskRule, TaskEvent } from "@/domain/types";
import type { Step1FormValues } from "../model";
import type { AddPlantStep2Data } from "@/lib/plants/add-plant-wizard/AddPlantWizardTypes";
import { toKstMidnight, toKstNoon } from "./dateUtils";

/**
 * Step1 폼 데이터로부터 Plant 객체 생성
 */
export function createPlantFromStep1(step1: Step1FormValues, now: number = Date.now()): Plant {
  const adoptedAt =
    step1.adoptedDate && step1.adoptedDate !== ""
      ? toKstMidnight(new Date(step1.adoptedDate))
      : now;

  const humidity =
    step1.humidityMin !== undefined && step1.humidityMax !== undefined
      ? { min: step1.humidityMin, max: step1.humidityMax }
      : null;

  const temperature =
    step1.temperatureMin !== undefined && step1.temperatureMax !== undefined
      ? { min: step1.temperatureMin, max: step1.temperatureMax }
      : null;

  return {
    id: generateId(),
    name: step1.name.trim(),
    adoptedAt,
    humidity,
    temperature,
    lightLevel: step1.lightLevel,
    isSensitive: step1.isSensitive,
    notes: "",
    coverPhotoUri: "",
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Step1과 Step2 데이터로부터 TaskRule 객체 생성
 */
export function createTaskRuleFromSteps(
  step1: Step1FormValues,
  step2: AddPlantStep2Data,
  plantId: string,
  now: number = Date.now()
): TaskRule {
  const wateredDates = step2.wateredDates;
  let lastDoneAt: number | null = null;

  if (wateredDates.length > 0) {
    const datesSorted = [...wateredDates].sort();
    const latest = datesSorted[datesSorted.length - 1];
    lastDoneAt = toKstNoon(new Date(latest));
  }

  const plant = createPlantFromStep1(step1, now);
  const intervalMs = step1.intervalDays * 24 * 60 * 60 * 1000;
  const baseForNextDue = lastDoneAt ?? plant.adoptedAt;
  const nextDueAt = baseForNextDue + intervalMs;

  return {
    id: generateId(),
    plantId,
    type: "water",
    intervalDays: step1.intervalDays,
    lastDoneAt,
    nextDueAt,
    note: "",
    active: 1,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Step2 데이터로부터 TaskEvent 배열 생성
 */
export function createTaskEventsFromStep2(
  step2: AddPlantStep2Data,
  plantId: string,
  now: number = Date.now()
): TaskEvent[] {
  return step2.wateredDates.map((dateStr) => {
    const doneAt = toKstNoon(new Date(dateStr));
    return {
      id: generateId(),
      plantId,
      type: "water",
      doneAt,
      note: "",
      createdAt: now,
    };
  });
}
