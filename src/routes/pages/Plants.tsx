import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStorage } from "../../lib/storage/useStorage";
import { generateId, type Plant } from "../../domain/types";
import { useState } from "react";

export function Plants() {
  const storage = useStorage();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);

  // 식물 추가 폼은 zod를 사용해서 유효성 검사 및 기능 정리 필요.
  const [newPlantName, setNewPlantName] = useState("");
  const [adoptedDate, setAdoptedDate] = useState<string>("");
  const [intervalDays, setIntervalDays] = useState<string>("7");
  const [isSensitive, setIsSensitive] = useState<"yes" | "no">("no");
  const [humidityMin, setHumidityMin] = useState<string>("");
  const [humidityMax, setHumidityMax] = useState<string>("");
  const [temperatureMin, setTemperatureMin] = useState<string>("");
  const [temperatureMax, setTemperatureMax] = useState<string>("");
  const [lightLevel, setLightLevel] = useState<"low" | "medium" | "high" | "">("");

  // 식물 목록 조회
  const {
    data: plants = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["plants"],
    queryFn: () => storage.listPlants(),
  });

  // 식물 추가 mutation
  const addPlantMutation = useMutation({
    mutationFn: async (
      plant: Omit<Plant, "id" | "createdAt" | "updatedAt"> & { waterIntervalDays: number }
    ) => {
      const now = Date.now();
      const id = generateId();
      const newPlant: Plant = {
        ...plant,
        id,
        createdAt: now,
        updatedAt: now,
      };
      await storage.upsertPlant(newPlant);

      // 물주기 규칙 생성 (최소 기능)
      const nextDueAt = newPlant.adoptedAt + plant.waterIntervalDays * 24 * 60 * 60 * 1000;
      await storage.upsertTaskRule({
        id: generateId(),
        plantId: newPlant.id,
        type: "water",
        intervalDays: plant.waterIntervalDays,
        lastDoneAt: null,
        nextDueAt,
        note: "",
        active: 1,
        createdAt: now,
        updatedAt: now,
      });

      return newPlant;
    },
    onSuccess: (newPlant) => {
      // 캐시 직접 업데이트: 새 식물을 기존 목록에 추가
      queryClient.setQueryData(["plants"], (oldPlants: Plant[] = []) => {
        return [...oldPlants, newPlant];
      });
      setShowAddForm(false);
      setNewPlantName("");
    },
    onError: (error) => {
      alert(error.message);
      // alert("식물 추가에 실패했습니다. 다시 시도해주세요.");
    },
  });

  // 식물 삭제 mutation
  const deletePlantMutation = useMutation({
    mutationFn: (id: string) => storage.deletePlant(id),
    onSuccess: (_, deletedId) => {
      // 캐시 직접 업데이트: 삭제된 식물을 목록에서 제거
      queryClient.setQueryData(["plants"], (oldPlants: Plant[] = []) => {
        return oldPlants.filter((plant) => plant.id !== deletedId);
      });
    },
    onError: () => {
      alert("식물 삭제에 실패했습니다. 다시 시도해주세요.");
    },
  });

  const handleAddPlant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlantName.trim()) return;
    if (!intervalDays) return;

    const adoptedAtMs = adoptedDate ? new Date(adoptedDate).getTime() : Date.now();
    const humMin = humidityMin !== "" ? Number(humidityMin) : undefined;
    const humMax = humidityMax !== "" ? Number(humidityMax) : undefined;
    const tmpMin = temperatureMin !== "" ? Number(temperatureMin) : undefined;
    const tmpMax = temperatureMax !== "" ? Number(temperatureMax) : undefined;

    const humidity =
      humMin !== undefined && humMax !== undefined ? { min: humMin, max: humMax } : null;
    const temperature =
      tmpMin !== undefined && tmpMax !== undefined ? { min: tmpMin, max: tmpMax } : null;

    addPlantMutation.mutate({
      name: newPlantName.trim(),
      adoptedAt: adoptedAtMs,
      notes: "",
      coverPhotoUri: "",
      humidity,
      temperature,
      lightLevel: lightLevel || null,
      isSensitive: isSensitive === "yes",
      waterIntervalDays: Number(intervalDays),
    });
  };

  const handleDeletePlant = (id: string) => {
    if (confirm("정말로 이 식물을 삭제하시겠습니까?")) {
      deletePlantMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">식물 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 p-4">
        <div className="text-center text-red-600">
          <p>식물 목록을 불러오는데 실패했습니다.</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["plants"] })}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Plants</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="rounded-[var(--radius)] bg-brand text-[--color-brand-foreground] px-3 py-2 text-sm"
        >
          새 식물 추가
        </button>
      </div>

      {showAddForm && (
        <div className="mb-4 p-4 border rounded-lg bg-gray-50">
          <h2 className="text-md font-semibold mb-2">새 식물 추가</h2>
          <form onSubmit={handleAddPlant} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
              <input
                type="text"
                value={newPlantName}
                onChange={(e) => setNewPlantName(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="식물 이름"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                키우기 시작한 날짜
              </label>
              <input
                type="date"
                value={adoptedDate}
                onChange={(e) => setAdoptedDate(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">물주기 주기 *</label>
              <select
                className="w-full px-3 py-2 border rounded"
                value={intervalDays}
                onChange={(e) => setIntervalDays(e.target.value)}
                required
              >
                {Array.from({ length: 30 }, (_, i) => String(i + 1)).map((d) => (
                  <option key={d} value={d}>
                    {d}일에 한 번
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">예민함 여부</label>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="sensitive"
                    value="yes"
                    checked={isSensitive === "yes"}
                    onChange={() => setIsSensitive("yes")}
                  />
                  예민함
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="sensitive"
                    value="no"
                    checked={isSensitive === "no"}
                    onChange={() => setIsSensitive("no")}
                  />
                  예민하지 않음
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">요구 습도(%)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="최소"
                  className="w-full px-3 py-2 border rounded"
                  value={humidityMin}
                  onChange={(e) => setHumidityMin(e.target.value)}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="최대"
                  className="w-full px-3 py-2 border rounded"
                  value={humidityMax}
                  onChange={(e) => setHumidityMax(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">요구 온도(℃)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="최소"
                  className="w-full px-3 py-2 border rounded"
                  value={temperatureMin}
                  onChange={(e) => setTemperatureMin(e.target.value)}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="최대"
                  className="w-full px-3 py-2 border rounded"
                  value={temperatureMax}
                  onChange={(e) => setTemperatureMax(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">요구 채광량</label>
              <select
                className="w-full px-3 py-2 border rounded"
                value={lightLevel}
                onChange={(e) => setLightLevel(e.target.value as typeof lightLevel)}
              >
                <option value="">선택 없음</option>
                <option value="low">적은</option>
                <option value="medium">보통</option>
                <option value="high">많은</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={addPlantMutation.isPending}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
              >
                {addPlantMutation.isPending ? "추가 중..." : "추가"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {plants.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>등록된 식물이 없습니다.</p>
          <p className="text-sm mt-2">위의 "새 식물 추가" 버튼을 눌러 첫 식물을 등록해보세요.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {plants.map((plant) => (
            <div
              key={plant.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex-1">
                <Link to={`/plants/${plant.id}`} className="text-brand font-medium hover:underline">
                  {plant.name}
                </Link>
                <div className="text-sm text-gray-600">
                  등록일: {new Date(plant.adoptedAt).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => handleDeletePlant(plant.id)}
                disabled={deletePlantMutation.isPending}
                className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
