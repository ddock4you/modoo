import { DailyList } from "@/features/weather/components/lists/DailyList";
import { useWeather } from "@/features/weather/hooks/useWeather";

export function WeatherCharts() {
  const { daily } = useWeather();

  return (
    <div>
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">7일 예보</h3>
        <DailyList points={daily ?? []} maxItems={7} showPrecipitation={true} showHumidity={false} />
      </div>
    </div>
  );
}
