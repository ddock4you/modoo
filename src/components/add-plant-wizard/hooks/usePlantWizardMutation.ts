import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { useStorage } from "@/lib/storage/useStorage";
import { useMedia } from "@/lib/media/useMedia";
import type { Step1FormValues } from "../model";
import type { Step2Data, Step3Data } from "../types";
import type { Plant } from "@/domain/types";
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

      if (step3.files.length > 0 && media) {
        const uploadedIds: string[] = [];
        for (let i = 0; i < step3.files.length; i++) {
          const photoMeta = await media.savePhoto(step3.files[i], plant.id);
          await storage.upsertPhoto(photoMeta);
          uploadedIds.push(photoMeta.id);
        }

        if (step3.coverIndex !== null && uploadedIds[step3.coverIndex]) {
          coverPhotoId = uploadedIds[step3.coverIndex];
        } else if (uploadedIds.length > 0) {
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

      queryClient.invalidateQueries({ queryKey: ["plants"] });
      queryClient.invalidateQueries({ queryKey: ["taskRules"] });
      queryClient.invalidateQueries({ queryKey: ["dueTasks"] });

      return { plantId: plant.id, coverPhotoId };
    },
  });
}
