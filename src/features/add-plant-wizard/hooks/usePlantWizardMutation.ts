import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { useStorage } from "@/lib/storage/useStorage";
import { useMedia } from "@/lib/media/useMedia";
import type { Step1FormValues } from "../model";
import type { Step2Data, Step3Data } from "../types";
import type { Plant } from "@/domain/types";
import { PLANTS_QK } from "@/features/plants/api/queryKeys";
import {
  createPlantFromStep1,
  createTaskRuleFromSteps,
  createTaskEventsFromStep2,
} from "../utils/plantCreationUtils";

type MutationParams = {
  step1: Step1FormValues;
  step2: Step2Data;
  step3: Step3Data;
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
      const rule = createTaskRuleFromSteps(step1, step2, plant.id, now);
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

        const uploadedByIndex: Array<string | null> = results.map((r) =>
          r.status === "fulfilled" ? r.value : null
        );

        const failedNames: string[] = [];
        for (let i = 0; i < results.length; i++) {
          if (results[i].status === "rejected") {
            failedNames.push(step3.files[i]?.name || `photo_${i + 1}`);
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

      return { plantId: plant.id, coverPhotoId, photoUpload };
    },
  });
}
