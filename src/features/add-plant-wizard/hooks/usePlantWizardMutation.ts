import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import type { Plant } from "@/domain/types";
import { PLANTS_QK } from "@/lib/query/plantsQueryKeys";
import { useMedia } from "@/providers/useMedia";
import type { AddPlantStep2Data, AddPlantStep3Data } from "@/lib/plants/add-plant-wizard/AddPlantWizardTypes";
import { useStorage } from "@/providers/useStorage";
import type { Step1FormValues } from "../model";
import {
  createPlantFromStep1,
  createTaskEventsFromStep2,
  createTaskRuleFromSteps,
} from "../utils/plantCreationUtils";

type MutationParams = {
  step1: Step1FormValues;
  step2: AddPlantStep2Data;
  step3: AddPlantStep3Data;
};

type MutationResult = {
  plantId: string;
  coverPhotoId: string | null;
  photoUpload?: {
    uploaded: number;
    failed: number;
    failedNames: string[];
  };
};

type MutationOptions = UseMutationOptions<MutationResult, Error, MutationParams>;

export function usePlantWizardMutation(options?: MutationOptions) {
  const storage = useStorage();
  const media = useMedia();
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: async ({ step1, step2, step3 }: MutationParams) => {
      const now = Date.now();
      const plant = createPlantFromStep1(step1, now);
      const rule = createTaskRuleFromSteps(step1, step2, plant.id, plant.adoptedAt, now);
      const events = createTaskEventsFromStep2(step2, plant.id, now);

      await storage.upsertPlant(plant);
      await storage.upsertTaskRule(rule);
      for (const ev of events) {
        await storage.logTaskEvent(ev);
      }

      let coverPhotoId: string | null = null;
      let photoUpload: MutationResult["photoUpload"] | undefined;

      if (step3.files.length > 0 && media) {
        const results = await Promise.allSettled(
          step3.files.map(async (file) => {
            const photoMeta = await media.savePhoto(file, plant.id);
            await storage.upsertPhoto(photoMeta);
            return photoMeta.id;
          })
        );

        const uploadedByIndex: Array<string | null> = results.map((result) =>
          result.status === "fulfilled" ? result.value : null
        );

        const failedNames: string[] = [];
        for (let index = 0; index < results.length; index += 1) {
          if (results[index].status === "rejected") {
            failedNames.push(step3.files[index]?.name || `photo_${index + 1}`);
          }
        }

        const uploadedIds = uploadedByIndex.filter((x): x is string => typeof x === "string");

        photoUpload = {
          uploaded: uploadedIds.length,
          failed: failedNames.length,
          failedNames,
        };

        if (step3.coverIndex !== null) {
          const desired = uploadedByIndex[step3.coverIndex];
          coverPhotoId = desired ?? null;
        }

        if (!coverPhotoId && uploadedIds.length > 0) {
          coverPhotoId = uploadedIds[0];
        }
      }

      if (coverPhotoId) {
        const updatedPlant: Plant = {
          ...plant,
          coverPhotoUri: coverPhotoId,
          updatedAt: Date.now(),
        };
        await storage.upsertPlant(updatedPlant);
      }

      queryClient.invalidateQueries({ queryKey: PLANTS_QK.list() });
      queryClient.invalidateQueries({ queryKey: PLANTS_QK.taskRules() });
      queryClient.invalidateQueries({ queryKey: PLANTS_QK.dueTasks() });
      queryClient.invalidateQueries({ queryKey: PLANTS_QK.statusAll() });
      queryClient.invalidateQueries({ queryKey: PLANTS_QK.statusStats() });

      return { plantId: plant.id, coverPhotoId, photoUpload };
    },
  });
}
