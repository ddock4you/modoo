// 화분 페이지 관련 타입 정의

export type PlantSortOption = "createdAt_desc" | "createdAt_asc";

export type PlantStatusFilter = "good" | "warning" | "danger" | null;

export interface PlantFilters {
  query: string;
  sort: PlantSortOption;
  status: PlantStatusFilter;
  dangerOnly: boolean;
}

export interface PlantsPageState {
  filters: PlantFilters;
  pagination: {
    page: number;
    pageSize: number;
    hasNextPage: boolean;
    isLoadingMore: boolean;
  };
}
