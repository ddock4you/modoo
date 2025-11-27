import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStorage } from "../../lib/storage/useStorage";
import { Button } from "../../components/ui/button";
import PlantsList from "../../components/PlantsList";
import { type Plant } from "../../domain/types";
import { useAddPlantWizard } from "../../lib/plants/AddPlantWizardContext";

export function Plants() {
  const storage = useStorage();
  const queryClient = useQueryClient();
  const { open } = useAddPlantWizard();

  // 식물 목록 조회
  const {
    data: plants = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["plants"],
    queryFn: () => storage.listPlants(),
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

  const handleDeletePlant = (id: string) => {
    if (confirm("정말로 이 식물을 삭제하시겠습니까?")) {
      deletePlantMutation.mutate(id);
    }
  };

  return (
    <div className="bg-background text-foreground p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Plants</h1>
        <Button onClick={() => open(1)} size="sm">
          새 식물 추가
        </Button>
      </div>

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
