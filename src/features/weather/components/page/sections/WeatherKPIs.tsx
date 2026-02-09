import { AirQualityBadge } from "@/features/weather/components/badges/AirQualityBadge";
import { useWeather, useWeatherFormat } from "@/features/weather/hooks/useWeather";
import { KpiCard } from "@/features/weather/components/page/ui/KpiCard";

export function WeatherKPIs() {
  const { now, airQuality, nowLoading, airQualityLoading } = useWeather();
  const { formatHumidity, formatWindSpeed, formatAirQuality } = useWeatherFormat();

  if (nowLoading || airQualityLoading) {
    return (
      <div className="grid grid-cols-4 gap-4 p-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-3 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2" />
            <div className="h-6 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const formatParticle = (value?: number | null) =>
    value !== undefined && value !== null ? `${value} µg/m³` : "측정중";

  const pm10Display = formatParticle(airQuality?.pm10);
  const pm25Display = formatParticle(airQuality?.pm25);
  const pm10Grade = formatAirQuality("pm10", airQuality?.pm10);
  const pm25Grade = formatAirQuality("pm25", airQuality?.pm25);

  return (
    <div className="grid grid-cols-4 gap-4 mb-12">
      <KpiCard
        title="습도"
        value={formatHumidity(now?.humidityPct)}
        className="bg-[#E6FCF1] rounded-sm py-4 px-1 text-[#4E4946]"
      />

      <KpiCard
        title="바람"
        value={formatWindSpeed(now?.windMs)}
        className="bg-[#FFEBD4] rounded-sm py-4 px-1 text-[#4E4946]"
      />

      <KpiCard
        title="미세먼지"
        value={pm10Display}
        footer={<AirQualityBadge grade={pm10Grade} size="sm" />}
        className="bg-[#FFEAE5] rounded-sm py-4 px-1 text-[#4E4946]"
      />

      <KpiCard
        title="초미세먼지"
        value={pm25Display}
        footer={<AirQualityBadge grade={pm25Grade} size="sm" />}
        className="bg-[#FFEAE5] rounded-sm py-4 px-1 text-[#4E4946]"
      />
    </div>
  );
}
