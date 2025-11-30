import { useQuery } from "@tanstack/react-query";
import { useStorage } from "../../lib/storage/useStorage";
import { Link } from "react-router-dom";
import { WeatherWidget } from "../../components/weather/widget/WeatherWidget";
import { VisualSection } from "../../components/dashboard-visual/VisualSection";
import { RecommendedWateringSchedule } from "../../components/watering-schedule";
import PlantsList from "../../components/PlantsList";
import { ChevronRight } from "lucide-react";

export function Dashboard() {
  const storage = useStorage();

  const {
    data: plants = [],
    isLoading: plantsLoading,
    error: plantsError,
    refetch: refetchPlants,
  } = useQuery({
    queryKey: ["plants"],
    queryFn: () => storage.listPlants(),
  });

  return (
    <div className="bg-background text-foreground">
      {/* Visual Section */}
      <div className="flex flex-col gap-10">
        <VisualSection />
        <div className="flex flex-col gap-7 px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#3A3431]">나의 화분 목록</h2>
            <Link to="/plants">
              <ChevronRight size={24} className="text-[#3A3431]" />
            </Link>
          </div>
          <PlantsList
            plants={plants}
            isLoading={plantsLoading}
            error={plantsError}
            onRetry={refetchPlants}
          />
        </div>
        <div className="px-6">
          <RecommendedWateringSchedule />
        </div>
      </div>

      {/* Weather Widget */}
      <div className="mt-6">
        <WeatherWidget />
      </div>
    </div>
  );
}
