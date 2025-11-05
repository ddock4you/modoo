import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStorage } from "../../lib/storage/StorageContext";
import type { Plant } from "../../domain/types";
import { useState } from "react";

export function Plants() {
  const storage = useStorage();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlantName, setNewPlantName] = useState("");
  const [newPlantSpecies, setNewPlantSpecies] = useState("");

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
    mutationFn: async (plant: Omit<Plant, "id" | "createdAt" | "updatedAt">) => {
      const now = Date.now();
      const newPlant: Plant = {
        ...plant,
        id: `plant-${now}`,
        createdAt: now,
        updatedAt: now,
      };
      await storage.upsertPlant(newPlant);
      return newPlant;
    },
    onSuccess: (newPlant) => {
      // 캐시 직접 업데이트: 새 식물을 기존 목록에 추가
      queryClient.setQueryData(["plants"], (oldPlants: Plant[] = []) => {
        return [...oldPlants, newPlant];
      });
      setShowAddForm(false);
      setNewPlantName("");
      setNewPlantSpecies("");
    },
    onError: () => {
      alert("식물 추가에 실패했습니다. 다시 시도해주세요.");
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

    addPlantMutation.mutate({
      name: newPlantName.trim(),
      species: newPlantSpecies.trim() || "Unknown",
      adoptedAt: Date.now(),
      location: "",
      notes: "",
      tags: JSON.stringify([]),
      coverPhotoUri: "",
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
          <form onSubmit={handleAddPlant} className="space-y-2">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">종류</label>
              <input
                type="text"
                value={newPlantSpecies}
                onChange={(e) => setNewPlantSpecies(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="예: Monstera deliciosa"
              />
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
                  {plant.species} • {plant.location || "위치 미정"}
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
