import { useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import type { Plant, TaskRule } from "../../domain/types";
import { Plant as PlantIcon } from "../icons/Plant";

interface SchedulePlantsProps {
  plants: Array<{
    plant: Plant;
    rule: TaskRule;
  }>;
}

const PLANTS_PER_PAGE = 2; // 한 페이지에 표시할 식물 수

export function SchedulePlants({ plants }: SchedulePlantsProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(plants.length / PLANTS_PER_PAGE);
  const startIndex = currentPage * PLANTS_PER_PAGE;
  const endIndex = startIndex + PLANTS_PER_PAGE;
  const currentPlants = plants.slice(startIndex, endIndex);

  if (plants.length === 0) {
    return (
      <div className="bg-[#22875F] rounded-lg p-6 text-center">
        <p className="text-white/80 text-sm">해당 일자에 물주기 예정인 식물이 없습니다.</p>
      </div>
    );
  }

  return (
    <div>
      {/* 식물 목록 카드 */}
      <div className="bg-[#22875F] rounded-lg p-4 mb-3">
        <div className="flex flex-wrap gap-2">
          {currentPlants.map(({ plant, rule }) => (
            <Link
              key={`${plant.id}-${rule.id}`}
              to={`/plants/${plant.id}`}
              className="flex items-center gap-2 bg-white border border-[#24D17E] rounded-full px-3 py-2 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#22875F]"
            >
              <PlantIcon size={20} className="text-[#24D17E] shrink-0" />
              <span className="text-sm font-medium text-[#3A3431] whitespace-nowrap">
                {plant.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 페이지네이션 도트 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={clsx(
                "w-2 h-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24D17E] focus-visible:ring-offset-2",
                {
                  "bg-[#24D17E]": index === currentPage,
                  "bg-gray-300": index !== currentPage,
                }
              )}
              aria-label={`${index + 1}페이지로 이동`}
              aria-current={index === currentPage ? "page" : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
