import type { ReactNode } from "react";
import { useEffect, useRef, useCallback } from "react";
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
  // 무한 스크롤 관련 props
  enableInfiniteScroll?: boolean;
  pageSize?: number;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  isLoadingMore?: boolean;
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

function PlantsListLoadingMore() {
  return (
    <div className="flex justify-center py-4">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"></div>
        <span>더 불러오는 중...</span>
      </div>
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
  enableInfiniteScroll,
  onLoadMore,
  hasNextPage,
  isLoadingMore,
}: {
  plants: Plant[];
  gridColumns?: number | null;
  direction?: "horizontal" | "vertical";
  maxItems?: number;
  renderPlantAction?: (plant: Plant) => ReactNode;
  enableInfiniteScroll?: boolean;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  isLoadingMore?: boolean;
}) {
  const displayPlants = maxItems ? plants.slice(0, maxItems) : plants;
  const observerTarget = useRef<HTMLDivElement>(null);

  const lastItemRef = useCallback(
    (node: HTMLDivElement) => {
      if (!enableInfiniteScroll || !hasNextPage || isLoadingMore) return;

      if (observerTarget.current) {
        observerTarget.current.disconnect();
      }

      observerTarget.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isLoadingMore) {
            onLoadMore?.();
          }
        },
        { threshold: 0.1 }
      );

      if (node) {
        observerTarget.current.observe(node);
      }
    },
    [enableInfiniteScroll, hasNextPage, isLoadingMore, onLoadMore]
  );

  useEffect(() => {
    return () => {
      if (observerTarget.current) {
        observerTarget.current.disconnect();
      }
    };
  }, []);

  return (
    <>
      <div
        className={clsx("gap-5 pb-2", {
          grid: gridColumns,
          "flex snap-x w-full overflow-x-auto": !gridColumns,
          [`grid-cols-${gridColumns}`]: gridColumns,
        })}
      >
        {displayPlants.map((plant, index) => {
          const isLastItem = index === displayPlants.length - 1;
          return (
            <div key={plant.id} ref={isLastItem ? lastItemRef : undefined}>
              <PlantCard
                plant={plant}
                footer={renderPlantAction?.(plant)}
                direction={direction}
                gridColumns={gridColumns}
              />
            </div>
          );
        })}
      </div>

      {enableInfiniteScroll && isLoadingMore && <PlantsListLoadingMore />}
    </>
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
  enableInfiniteScroll,
  pageSize,
  onLoadMore,
  hasNextPage,
  isLoadingMore,
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
      enableInfiniteScroll={enableInfiniteScroll}
      onLoadMore={onLoadMore}
      hasNextPage={hasNextPage}
      isLoadingMore={isLoadingMore}
    />
  );
}
