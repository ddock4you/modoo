import { useState, useMemo, useCallback } from "react";
import type { Plant, TaskRule } from "../../../domain/types";
import { filterPlants, getDefaultFilters } from "../model";
import type { PlantFilters } from "../types";

export function usePlantFilters(plants: Plant[], rules: TaskRule[]) {
  const [filters, setFilters] = useState<PlantFilters>(getDefaultFilters);

  const filteredPlants = useMemo(() => {
    return filterPlants(plants, rules, filters);
  }, [plants, rules, filters]);

  const updateFilters = useCallback((newFilters: Partial<PlantFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(getDefaultFilters());
  }, []);

  return {
    filters,
    filteredPlants,
    updateFilters,
    resetFilters,
  };
}
