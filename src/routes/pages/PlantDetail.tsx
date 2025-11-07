import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStorage } from "../../lib/storage/useStorage";
import { useMedia } from "../../lib/media/useMedia";
import { updateRuleAfterTaskCompletion } from "../../domain/use-cases/calculateNextDue";
import type { Plant, TaskRule, TaskEvent, PhotoMeta } from "../../domain/types";
import { generateId } from "../../domain/types";

export function PlantDetail() {
  const { id } = useParams();
  const storage = useStorage();
  const media = useMedia();
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // 식물 정보 조회
  const {
    data: plant,
    isLoading: plantLoading,
    error: plantError,
  } = useQuery({
    queryKey: ["plant", id],
    queryFn: async (): Promise<Plant | undefined> => {
      if (!id) return undefined;
      return await storage.getPlant(id);
    },
    enabled: !!id,
  });

  // 식물의 작업 규칙 조회
  const {
    data: taskRules = [],
    isLoading: rulesLoading,
    error: rulesError,
  } = useQuery({
    queryKey: ["taskRules", id],
    queryFn: async (): Promise<TaskRule[]> => {
      if (!id) return [];
      return await storage.listTaskRules(id);
    },
    enabled: !!id,
  });

  // 식물 사진 조회
  const {
    data: photos = [],
    isLoading: photosLoading,
    error: photosError,
  } = useQuery({
    queryKey: ["photos", id],
    queryFn: async (): Promise<PhotoMeta[]> => {
      if (!id) return [];
      return await storage.listPhotos(id);
    },
    enabled: !!id,
  });

  // 작업 완료 mutation
  const completeTaskMutation = useMutation({
    mutationFn: async ({ rule }: { rule: TaskRule }) => {
      const now = Date.now();

      // TaskEvent 생성 및 저장
      const taskEvent: TaskEvent = {
        id: generateId(),
        plantId: rule.plantId,
        type: rule.type,
        doneAt: now,
        note: "",
        createdAt: now,
      };
      await storage.logTaskEvent(taskEvent);

      // TaskRule 갱신
      const updatedRule = updateRuleAfterTaskCompletion(rule);
      await storage.upsertTaskRule(updatedRule);

      return { taskEvent, updatedRule };
    },
    onSuccess: () => {
      // 관련 쿼리들을 무효화하여 UI 갱신
      queryClient.invalidateQueries({ queryKey: ["taskRules", id] });
      queryClient.invalidateQueries({ queryKey: ["dueTasks"] });
      queryClient.invalidateQueries({ queryKey: ["plant", id] });
    },
  });

  // 사진 업로드 mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!media || !id) throw new Error("Media store not available or invalid plant ID");

      setUploadProgress(0); // 진행률 초기화

      // 사진 저장 및 메타데이터 생성 (내부에서 압축 진행률 업데이트)
      const photoMeta = await media.savePhoto(file, id, (progress: number) => {
        setUploadProgress(progress);
      });

      // DB에 메타데이터 저장
      await storage.upsertPhoto(photoMeta);

      return photoMeta;
    },
    onSuccess: () => {
      setUploadProgress(0); // 진행률 초기화
      // 사진 목록 갱신
      queryClient.invalidateQueries({ queryKey: ["photos", id] });
    },
    onError: () => {
      setUploadProgress(0); // 에러 시 진행률 초기화
    },
  });

  // 사진 삭제 mutation
  const deletePhotoMutation = useMutation({
    mutationFn: async (photo: PhotoMeta) => {
      if (!media) throw new Error("Media store not available");

      // 미디어 저장소에서 파일 삭제
      await media.remove(photo.uri, photo.thumbUri);

      // DB에서 메타데이터 삭제
      await storage.deletePhoto(photo.id);
    },
    onSuccess: () => {
      // 사진 목록 갱신
      queryClient.invalidateQueries({ queryKey: ["photos", id] });
    },
  });

  if (!id) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 p-4">
        <p className="text-red-600">식물 ID가 필요합니다.</p>
      </div>
    );
  }

  if (plantLoading) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">식물 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (plantError || !plant) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 p-4">
        <div className="text-center py-8">
          <p className="text-red-600">식물을 찾을 수 없습니다.</p>
          <Link to="/plants" className="text-blue-600 hover:underline mt-2 inline-block">
            식물 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatHumidity = (humidity: Plant["humidity"]) => {
    if (!humidity) return "정보 없음";
    return `${humidity.min}% - ${humidity.max}%`;
  };

  const formatTemperature = (temperature: Plant["temperature"]) => {
    if (!temperature) return "정보 없음";
    return `${temperature.min}°C - ${temperature.max}°C`;
  };

  const formatLightLevel = (lightLevel: Plant["lightLevel"]) => {
    switch (lightLevel) {
      case "low":
        return "약한 빛";
      case "medium":
        return "중간 빛";
      case "high":
        return "강한 빛";
      default:
        return "정보 없음";
    }
  };

  const formatNextDue = (nextDueAt: number) => {
    const now = Date.now();
    const diffMs = nextDueAt - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)}일 지남`;
    } else if (diffDays === 0) {
      return "오늘";
    } else {
      return `${diffDays}일 후`;
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/plants" className="text-blue-600 hover:underline">
          ← 식물 목록
        </Link>
        <h1 className="text-lg font-semibold">{plant.name}</h1>
        <div className="w-16"></div> {/* 균형 맞추기용 */}
      </div>

      {/* 식물 기본 정보 */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h2 className="font-semibold mb-3">기본 정보</h2>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">입양일:</span> {formatDate(plant.adoptedAt)}
          </div>
          {plant.humidity && (
            <div>
              <span className="font-medium">습도:</span> {formatHumidity(plant.humidity)}
            </div>
          )}
          {plant.temperature && (
            <div>
              <span className="font-medium">온도:</span> {formatTemperature(plant.temperature)}
            </div>
          )}
          {plant.lightLevel && (
            <div>
              <span className="font-medium">채광량:</span> {formatLightLevel(plant.lightLevel)}
            </div>
          )}
          {plant.isSensitive && (
            <div>
              <span className="font-medium text-orange-600">주의:</span> 예민한 식물입니다
            </div>
          )}
          {plant.notes && (
            <div>
              <span className="font-medium">메모:</span> {plant.notes}
            </div>
          )}
        </div>
      </div>

      {/* 작업 규칙 */}
      <div className="mb-6">
        <h2 className="font-semibold mb-3">작업 규칙</h2>
        {rulesLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : rulesError ? (
          <p className="text-red-600 text-sm">규칙을 불러오는데 실패했습니다.</p>
        ) : taskRules.length === 0 ? (
          <p className="text-gray-500 text-sm">설정된 작업 규칙이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {taskRules.map((rule) => (
              <div
                key={rule.id}
                className={`border rounded-lg p-3 ${
                  rule.active === 0
                    ? "border-gray-200 bg-gray-50"
                    : rule.nextDueAt < Date.now()
                    ? "border-red-200 bg-red-50"
                    : "border-green-200 bg-green-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{rule.type === "water" ? "💧" : "🌱"}</span>
                      <span className="font-medium">
                        {rule.type === "water" ? "물주기" : "비료주기"}
                      </span>
                      {rule.active === 0 && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                          비활성
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {rule.intervalDays}일마다 • 다음: {formatNextDue(rule.nextDueAt)}
                    </div>
                    {rule.note && <div className="text-xs text-gray-500 mt-1">{rule.note}</div>}
                  </div>
                  {rule.active === 1 && (
                    <button
                      onClick={() => completeTaskMutation.mutate({ rule })}
                      disabled={completeTaskMutation.isPending}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {completeTaskMutation.isPending ? "처리중..." : "완료하기"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 사진 */}
      <div className="mb-6">
        <h2 className="font-semibold mb-3">사진</h2>

        {/* 사진 업로드 */}
        <div className="mb-4">
          <label className="inline-block">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  uploadPhotoMutation.mutate(file);
                }
                // 같은 파일 재선택 가능하도록 초기화
                e.target.value = "";
              }}
              disabled={uploadPhotoMutation.isPending || !media}
            />
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                uploadPhotoMutation.isPending || !media ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <span className="text-lg">📷</span>
              <span className="text-sm font-medium">
                {uploadPhotoMutation.isPending ? "압축 및 업로드 중..." : "사진 촬영/선택"}
              </span>
            </div>
          </label>

          {/* 업로드 진행률 표시 */}
          {uploadPhotoMutation.isPending && uploadProgress > 0 && (
            <div className="mt-2 w-full max-w-xs">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <span>압축 진행률</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {!media && (
            <p className="text-xs text-orange-600 mt-1">
              브라우저가 사진 저장을 지원하지 않습니다.
            </p>
          )}
        </div>

        {/* 사진 목록 */}
        {photosLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : photosError ? (
          <p className="text-red-600 text-sm">사진을 불러오는데 실패했습니다.</p>
        ) : photos.length === 0 ? (
          <p className="text-gray-500 text-sm">등록된 사진이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="relative">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {media ? (
                    <PhotoThumbnail
                      photo={photo}
                      onDelete={() => deletePhotoMutation.mutate(photo)}
                      isDeleting={deletePhotoMutation.isPending}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span className="text-2xl">🖼️</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(photo.createdAt).toLocaleDateString("ko-KR")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 사진 스켈레톤 컴포넌트
function PhotoSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="animate-pulse">
        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
      </div>
    </div>
  );
}

// 사진 썸네일 컴포넌트
function PhotoThumbnail({
  photo,
  onDelete,
  isDeleting,
}: {
  photo: PhotoMeta;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const media = useMedia();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let url: string | null = null;

    if (media && "getThumbnailUrl" in media) {
      // IndexedDBMediaStore의 썸네일 URL 가져오기
      const mediaWithThumbnail = media as typeof media & {
        getThumbnailUrl: (id: string) => Promise<string>;
      };
      mediaWithThumbnail
        .getThumbnailUrl(photo.id)
        .then((thumbnailUrl: string) => {
          url = thumbnailUrl;
          setImageUrl(thumbnailUrl);
        })
        .catch(() => setImageUrl(null))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }

    // 컴포넌트 언마운트 시 Blob URL 정리
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [media, photo.id]);

  if (isLoading) {
    return <PhotoSkeleton />;
  }

  if (!imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        <span className="text-xl">❌</span>
      </div>
    );
  }

  return (
    <div className="relative group">
      <img src={imageUrl} alt="식물 사진" className="w-full h-full object-cover" />
      <button
        onClick={onDelete}
        disabled={isDeleting}
        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
      >
        {isDeleting ? "…" : "×"}
      </button>
    </div>
  );
}
