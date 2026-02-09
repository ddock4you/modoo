import { WeatherWidget } from "@/features/weather/components/widget/WeatherWidget";
import { CurrentWeatherCard } from "@/features/weather/components/page/sections/CurrentWeatherCard";
import { WeatherCharts } from "@/features/weather/components/page/sections/WeatherCharts";
import { WeatherHeader } from "@/features/weather/components/page/sections/WeatherHeader";
import { WeatherKPIs } from "@/features/weather/components/page/sections/WeatherKPIs";

export function WeatherPage() {
  return (
    <div className="min-h-screen px-6 pt-7">
      <div className="mb-5">
        <WeatherHeader />
      </div>
      <main className="pb-6">
        <CurrentWeatherCard />
        <WeatherKPIs />
        <WeatherWidget />
        <WeatherCharts />
      </main>
    </div>
  );
}
