import type { ReactNode } from "react";
import clsx from "clsx";
import { Button } from "./ui/button";
import type { Plant } from "../domain/types";
import PlantCard from "./PlantCard";

interface PlantsListProps {
  plants: Plant[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  renderPlantAction?: (plant: Plant) => ReactNode;
  gridColumns?: number | null;
  direction?: "horizontal" | "vertical";
  maxItems?: number;
}

function PlantsListError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : "식물 목록을 불러오는데 실패했습니다.";
  return (
    <div className="rounded-3xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
      <p className="font-semibold">오류가 발생했습니다.</p>
      <p className="text-xs text-destructive/70">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry} className="mt-3">
          다시 시도
        </Button>
      )}
    </div>
  );
}

function PlantsListLoading({
  gridColumns,
  direction,
  maxItems,
}: {
  gridColumns?: number | null;
  direction?: "horizontal" | "vertical";
  maxItems?: number;
}) {
  const skeletonCount = maxItems || 3;

  return (
    <div
      className={clsx("mt-2 gap-4 pb-2", {
        grid: gridColumns,
        [`grid-cols-${gridColumns}`]: gridColumns,
        "flex overflow-x-auto": !gridColumns,
      })}
    >
      {Array.from({ length: skeletonCount }, (_, index) => (
        <PlantCard
          key={index}
          isLoading={true}
          direction={direction}
          className={clsx({
            "w-full": gridColumns,
            "snap-start w-[260px] shrink-0": !gridColumns,
          })}
        />
      ))}
    </div>
  );
}

function PlantsListEmpty() {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 text-center text-sm text-muted-foreground">
      <p className="font-semibold text-white">등록된 식물이 아직 없어요.</p>
      <p className="text-xs">
        상단 버튼을 눌러 식물 정보를 추가하거나, 다른 화면에서 식물을 가져올 수 있어요.
      </p>
    </div>
  );
}

function PlantsListContent({
  plants,
  gridColumns,
  direction,
  maxItems,
  renderPlantAction,
}: {
  plants: Plant[];
  gridColumns?: number | null;
  direction?: "horizontal" | "vertical";
  maxItems?: number;
  renderPlantAction?: (plant: Plant) => ReactNode;
}) {
  const displayPlants = maxItems ? plants.slice(0, maxItems) : plants;

  return (
    <div
      className={clsx("gap-5 pb-2", {
        grid: gridColumns,
        "flex snap-x w-full overflow-x-auto": !gridColumns,
        [`grid-cols-${gridColumns}`]: gridColumns,
      })}
    >
      {displayPlants.map((plant) => (
        <PlantCard
          key={plant.id}
          plant={plant}
          footer={renderPlantAction?.(plant)}
          direction={direction}
        />
      ))}
    </div>
  );
}

export default function PlantsList({
  plants,
  isLoading,
  error,
  onRetry,
  renderPlantAction,
  gridColumns,
  direction,
  maxItems,
}: PlantsListProps) {
  if (error) {
    return <PlantsListError error={error} onRetry={onRetry} />;
  }

  if (isLoading) {
    return (
      <PlantsListLoading gridColumns={gridColumns} direction={direction} maxItems={maxItems} />
    );
  }

  if (plants.length === 0) {
    return <PlantsListEmpty />;
  }

  return (
    <PlantsListContent
      plants={plants}
      gridColumns={gridColumns}
      direction={direction}
      maxItems={maxItems}
      renderPlantAction={renderPlantAction}
    />
  );
}
