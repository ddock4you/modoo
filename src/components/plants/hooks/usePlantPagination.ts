import { useState, useMemo } from "react";
import type { Plant } from "../../../domain/types";

interface UsePlantPaginationOptions {
  pageSize?: number;
  enableInfiniteScroll?: boolean;
}

export function usePlantPagination(
  plants: Plant[],
  { pageSize = 20, enableInfiniteScroll = false }: UsePlantPaginationOptions = {}
) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const paginatedPlants = useMemo(() => {
    if (!enableInfiniteScroll) {
      return plants;
    }

    const endIndex = currentPage * pageSize;
    return plants.slice(0, endIndex);
  }, [plants, currentPage, pageSize, enableInfiniteScroll]);

  const hasNextPage = enableInfiniteScroll && paginatedPlants.length < plants.length;

  const loadMore = async () => {
    if (!hasNextPage || isLoadingMore) return;

    setIsLoadingMore(true);

    // 실제로는 API 호출이나 비동기 작업이 있을 수 있음
    // 여기서는 간단히 setTimeout으로 시뮬레이션
    await new Promise((resolve) => setTimeout(resolve, 500));

    setCurrentPage((prev) => prev + 1);
    setIsLoadingMore(false);
  };

  const resetPagination = () => {
    setCurrentPage(1);
    setIsLoadingMore(false);
  };

  return {
    paginatedPlants,
    hasNextPage,
    isLoadingMore,
    loadMore,
    resetPagination,
    currentPage,
    totalPages: enableInfiniteScroll ? Math.ceil(plants.length / pageSize) : 1,
  };
}
