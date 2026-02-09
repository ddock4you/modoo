import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStorage } from "@/lib/storage/useStorage";
import { usePlantFilters, usePlantPagination } from "../hooks";
import { PlantFilters } from "./ui";
import PlantsList from "./PlantsList";
import { Button } from "../../../components/ui/button";
import type { Plant, TaskRule } from "@/domain/types";
import { PLANTS_QK } from "@/features/plants/api/queryKeys";

export function PlantsTab() {
  const storage = useStorage();
  const queryClient = useQueryClient();

  // 식물 목록 조회
  const {
    data: plants = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: PLANTS_QK.list(),
    queryFn: () => storage.listPlants(),
  });

  const { data: taskRules = [], isLoading: isRulesLoading } = useQuery<TaskRule[]>({
    queryKey: PLANTS_QK.taskRules(),
    queryFn: () => storage.listTaskRules(),
  });

  // 필터링 적용
  const { filters, filteredPlants, updateFilters, resetFilters } = usePlantFilters(
    plants,
    taskRules
  );

  // 페이지네이션 적용 (무한 스크롤)
  const { paginatedPlants, hasNextPage, isLoadingMore, loadMore } = usePlantPagination(
    filteredPlants,
    {
      enableInfiniteScroll: true,
      pageSize: 20,
    }
  );

  // 식물 삭제 mutation
  const deletePlantMutation = useMutation({
    mutationFn: (id: string) => storage.deletePlant(id),
    onSuccess: (_, deletedId) => {
      // 캐시 직접 업데이트: 삭제된 식물을 목록에서 제거
      queryClient.setQueryData(PLANTS_QK.list(), (oldPlants: Plant[] = []) => {
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

  const handleWateringRecord = (plantId: string) => {
    // TODO: 물주기 기록 기능 구현
    console.log("물주기 기록:", plantId);
  };

  return (
    <div className="space-y-4">
      {/* 필터 UI */}
      <PlantFilters filters={filters} onFiltersChange={updateFilters} onReset={resetFilters} />

      {/* 식물 리스트 */}
      <PlantsList
        plants={paginatedPlants}
        isLoading={isLoading || isRulesLoading}
        error={error}
        onRetry={() => queryClient.invalidateQueries({ queryKey: PLANTS_QK.list() })}
        gridColumns={3}
        enableInfiniteScroll={true}
        onLoadMore={loadMore}
        hasNextPage={hasNextPage}
        isLoadingMore={isLoadingMore}
        renderPlantAction={(plant) => (
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => handleWateringRecord(plant.id)}
              size="sm"
              className="w-full rounded-sm"
              variant="outline"
            >
              물주기 기록
            </Button>
            <Button
              onClick={() => handleDeletePlant(plant.id)}
              disabled={deletePlantMutation.isPending}
              variant="outline"
              size="sm"
              className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              삭제
            </Button>
          </div>
        )}
      />
    </div>
  );
}
