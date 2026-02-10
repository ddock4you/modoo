import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, SlidersVertical } from "lucide-react";
import { useAddPlantWizardActions } from "@/lib/plants/add-plant-wizard/hooks";
import { useDebounce } from "@/features/plants/utils";
import type { PlantFilters } from "@/features/plants/types";
import { Flowerpot } from "@/components/icons";

interface PlantFiltersProps {
  filters: PlantFilters;
  onFiltersChange: (filters: Partial<PlantFilters>) => void;
  onReset: () => void;
}

export function PlantFilters({ filters, onFiltersChange, onReset }: PlantFiltersProps) {
  const [searchQuery, setSearchQuery] = useState(filters.query);
  const { open } = useAddPlantWizardActions();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    onFiltersChange({ query: debouncedSearchQuery });
  }, [debouncedSearchQuery, onFiltersChange]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleReset = () => {
    setSearchQuery("");
    onReset();
  };

  return (
    <div className="space-y-3">
      {/* 검색창 행 */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="식물 이름으로 검색..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pr-10"
          />
        </div>
        <button onClick={() => open(1)} className="bg-transparent p-1">
          <Flowerpot className="shrink-0" />
        </button>
      </div>

      {/* 필터 행 */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <SlidersVertical className="w-4 h-4" />
          <Select
            value={filters.sort}
            onValueChange={(value: PlantFilters["sort"]) => onFiltersChange({ sort: value })}
          >
            <SelectTrigger size="sm" className="w-fit border-none shadow-none px-1 py-1 min-h-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt_desc">최신순</SelectItem>
              <SelectItem value="createdAt_asc">오래된 순</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.status || undefined}
            onValueChange={(value: string) =>
              onFiltersChange({
                status: (value === "all" ? null : value) as PlantFilters["status"],
              })
            }
          >
            <SelectTrigger size="sm" className="w-fit border-none shadow-none px-1 py-1 min-h-auto">
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="good">양호</SelectItem>
              <SelectItem value="warning">주의</SelectItem>
              <SelectItem value="danger">위험</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="danger-only"
            checked={filters.dangerOnly}
            onCheckedChange={(checked) => onFiltersChange({ dangerOnly: checked as boolean })}
          />
          <label
            htmlFor="danger-only"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            위험 식물만 보기
          </label>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-sm font-medium text-muted-foreground"
        >
          초기화
        </button>
      </div>
    </div>
  );
}
