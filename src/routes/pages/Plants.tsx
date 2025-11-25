import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStorage } from "../../lib/storage/useStorage";
import { Button } from "../../components/ui/button";
import PlantsList from "../../components/PlantsList";
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

  return (
    <div className="bg-background text-foreground p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Plants</h1>
        <Button onClick={() => setShowAddForm(true)} size="sm">
          새 식물 추가
        </Button>
      </div>

      {showAddForm && (
        <div className="mb-4 p-4 border rounded-lg bg-muted/50">
          <h2 className="text-md font-semibold mb-2">새 식물 추가</h2>
          <form onSubmit={handleAddPlant} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">이름 *</label>
              <input
                type="text"
                value={newPlantName}
                onChange={(e) => setNewPlantName(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="식물 이름"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">키우기 시작한 날짜</label>
              <input
                type="date"
                value={adoptedDate}
                onChange={(e) => setAdoptedDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">물주기 주기 *</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
              <label className="block text-sm font-medium mb-1">예민함 여부</label>
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
              <label className="block text-sm font-medium mb-1">요구 습도(%)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="최소"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={humidityMin}
                  onChange={(e) => setHumidityMin(e.target.value)}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="최대"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={humidityMax}
                  onChange={(e) => setHumidityMax(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">요구 온도(℃)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="최소"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={temperatureMin}
                  onChange={(e) => setTemperatureMin(e.target.value)}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="최대"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={temperatureMax}
                  onChange={(e) => setTemperatureMax(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">요구 채광량</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
              <Button type="submit" disabled={addPlantMutation.isPending} className="flex-1">
                {addPlantMutation.isPending ? "추가 중..." : "추가"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddForm(false)}
                className="flex-1"
              >
                취소
              </Button>
            </div>
          </form>
        </div>
      )}

      <PlantsList
        plants={plants}
        isLoading={isLoading}
        error={error}
        onRetry={() => queryClient.invalidateQueries({ queryKey: ["plants"] })}
        renderPlantAction={(plant) => (
          <Button
            onClick={() => handleDeletePlant(plant.id)}
            disabled={deletePlantMutation.isPending}
            variant="outline"
            size="sm"
            className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            삭제
          </Button>
        )}
      />
    </div>
  );
}
