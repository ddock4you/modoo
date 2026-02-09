import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useStorage } from "@/lib/storage/useStorage";
import { useMedia } from "@/lib/media/useMedia";
import { PLANTS_QK } from "@/features/plants/api/queryKeys";
import { generateId } from "@/lib/utils/id";
import type { PhotoMeta, Plant, TaskEvent, TaskRule } from "@/domain/types";
import { updateRuleAfterTaskCompletion } from "@/domain/plants/use-cases/calculateNextDue";
import { PlantDetailHeader } from "./sections/PlantDetailHeader";
import { PlantBasicInfoSection } from "./sections/PlantBasicInfoSection";
import { PlantTaskRulesSection } from "./sections/PlantTaskRulesSection";
import { PlantPhotosSection } from "./sections/PlantPhotosSection";

export function PlantDetailView({ plantId }: { plantId: string }) {
  const storage = useStorage();
  const media = useMedia();
  const queryClient = useQueryClient();

  const [uploadProgress, setUploadProgress] = useState(0);
  useEffect(() => {
    setUploadProgress(0);
  }, [plantId]);

  const nowMs = Date.now();

  const {
    data: plant,
    isLoading: plantLoading,
    error: plantError,
  } = useQuery({
    queryKey: PLANTS_QK.detail(plantId),
    queryFn: async (): Promise<Plant | undefined> => {
      if (!plantId) return undefined;
      return storage.getPlant(plantId);
    },
    enabled: !!plantId,
  });

  const {
    data: taskRules = [],
    isLoading: rulesLoading,
    error: rulesError,
  } = useQuery({
    queryKey: PLANTS_QK.taskRules(plantId),
    queryFn: async (): Promise<TaskRule[]> => {
      if (!plantId) return [];
      return storage.listTaskRules(plantId);
    },
    enabled: !!plantId,
  });

  const {
    data: photos = [],
    isLoading: photosLoading,
    error: photosError,
  } = useQuery({
    queryKey: PLANTS_QK.photos(plantId),
    queryFn: async (): Promise<PhotoMeta[]> => {
      if (!plantId) return [];
      return storage.listPhotos(plantId);
    },
    enabled: !!plantId,
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (rule: TaskRule) => {
      const doneAt = Date.now();
      const taskEvent: TaskEvent = {
        id: generateId(),
        plantId: rule.plantId,
        type: rule.type,
        doneAt,
        note: "",
        createdAt: doneAt,
      };

      await storage.logTaskEvent(taskEvent);

      const updatedRule = updateRuleAfterTaskCompletion(rule, doneAt);
      await storage.upsertTaskRule(updatedRule);

      return { taskEvent, updatedRule };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLANTS_QK.taskRules(plantId) });
      queryClient.invalidateQueries({ queryKey: PLANTS_QK.dueTasks() });
      queryClient.invalidateQueries({ queryKey: PLANTS_QK.detail(plantId) });
    },
    onError: () => {
      alert("작업 완료 처리에 실패했습니다. 다시 시도해주세요.");
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploadProgress(0);

      const photoMeta = await media.savePhoto(file, plantId, (progress) => {
        setUploadProgress(progress);
      });

      await storage.upsertPhoto(photoMeta);

      // coverPhotoUri가 비어 있으면 첫 사진을 대표로 자동 지정
      const currentPlant = await storage.getPlant(plantId);
      if (currentPlant && !currentPlant.coverPhotoUri) {
        const now = Date.now();
        await storage.upsertPlant({
          ...currentPlant,
          coverPhotoUri: photoMeta.id,
          updatedAt: now,
        });
      }

      return photoMeta;
    },
    onSuccess: () => {
      setUploadProgress(0);
      queryClient.invalidateQueries({ queryKey: PLANTS_QK.photos(plantId) });
      queryClient.invalidateQueries({ queryKey: PLANTS_QK.detail(plantId) });
      queryClient.invalidateQueries({ queryKey: PLANTS_QK.list() });
    },
    onError: () => {
      setUploadProgress(0);
      alert("사진 업로드에 실패했습니다. 다시 시도해주세요.");
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (photo: PhotoMeta) => {
      const currentPlant = await storage.getPlant(plantId);
      const wasCover = !!currentPlant && currentPlant.coverPhotoUri === photo.id;

      await media.remove(photo.id, photo.thumbUri);
      await storage.deletePhoto(photo.id);

      if (currentPlant && wasCover) {
        const remainingPhotos = await storage.listPhotos(plantId);
        let nextCover: PhotoMeta | undefined;
        for (const p of remainingPhotos) {
          if (!nextCover || p.createdAt > nextCover.createdAt) {
            nextCover = p;
          }
        }
        const nextCoverId = nextCover?.id ?? "";
        const now = Date.now();
        await storage.upsertPlant({
          ...currentPlant,
          coverPhotoUri: nextCoverId,
          updatedAt: now,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLANTS_QK.photos(plantId) });
      queryClient.invalidateQueries({ queryKey: PLANTS_QK.detail(plantId) });
      queryClient.invalidateQueries({ queryKey: PLANTS_QK.list() });
    },
    onError: () => {
      alert("사진 삭제에 실패했습니다. 다시 시도해주세요.");
    },
  });

  const setCoverPhotoMutation = useMutation({
    mutationFn: async (photoId: string) => {
      const currentPlant = await storage.getPlant(plantId);
      if (!currentPlant) throw new Error("Plant not found");

      if (currentPlant.coverPhotoUri === photoId) return;

      const now = Date.now();
      await storage.upsertPlant({
        ...currentPlant,
        coverPhotoUri: photoId,
        updatedAt: now,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLANTS_QK.detail(plantId) });
      queryClient.invalidateQueries({ queryKey: PLANTS_QK.list() });
    },
    onError: () => {
      alert("대표 사진 설정에 실패했습니다. 다시 시도해주세요.");
    },
  });

  if (!plantId) {
    return (
      <div className="bg-background text-foreground p-4">
        <p className="text-destructive">식물 ID가 필요합니다.</p>
      </div>
    );
  }

  if (plantLoading) {
    return (
      <div className="bg-background text-foreground p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-muted-foreground">식물 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (plantError || !plant) {
    return (
      <div className="bg-background text-foreground p-4">
        <div className="text-center py-8">
          <p className="text-destructive">식물을 찾을 수 없습니다.</p>
          <Link
            to="/plants"
            className="text-primary hover:underline mt-2 inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            식물 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground p-4">
      <PlantDetailHeader plantName={plant.name} />
      <PlantBasicInfoSection plant={plant} />
      <PlantTaskRulesSection
        rules={taskRules}
        isLoading={rulesLoading}
        error={rulesError}
        nowMs={nowMs}
        onCompleteRule={(rule) => completeTaskMutation.mutate(rule)}
        isCompleting={completeTaskMutation.isPending}
      />
      <PlantPhotosSection
        photos={photos}
        isLoading={photosLoading}
        error={photosError}
        coverPhotoId={plant.coverPhotoUri}
        uploadProgress={uploadProgress}
        isUploading={uploadPhotoMutation.isPending}
        onUpload={(file) => uploadPhotoMutation.mutate(file)}
        isSettingCover={setCoverPhotoMutation.isPending}
        settingCoverId={setCoverPhotoMutation.variables ?? null}
        onSetCover={(photo) => setCoverPhotoMutation.mutate(photo.id)}
        isDeleting={deletePhotoMutation.isPending}
        onDelete={(photo) => deletePhotoMutation.mutate(photo)}
      />
    </div>
  );
}
