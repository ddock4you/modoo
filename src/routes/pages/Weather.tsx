import { AlertCircle } from "lucide-react";
import {
  useWeather,
  useWeatherFormat,
  useWeatherIcon,
  useYesterdayTemperatureComparison,
} from "../../lib/weather/useWeather";
import { DailyList } from "../../components/weather/lists/DailyList";
import { LocationSection } from "@/components/dashboard-visual/LocationSection";
import { useLocationSearch } from "@/lib/weather/useLocationSearch";
import { WeatherWidget } from "@/components/weather/widget/WeatherWidget";
import { AirQualityBadge } from "@/components/weather/badges/AirQualityBadge";

function WeatherHeader() {
  const { location } = useWeather();
  const {
    searchLocation,
    isLoading: isLocating,
    error: locationError,
  } = useLocationSearch({
    updateWeatherLocation: true,
    autoClearError: true,
    errorClearDelay: 5000,
  });
  return (
    <div className="flex w-full justify-center">
      <LocationSection
        locationName={location?.name}
        isLocating={isLocating}
        locationError={locationError}
        onSearchLocation={searchLocation}
      />
    </div>
  );
}

function WeatherKPIs() {
  const { now, airQuality, nowLoading, airQualityLoading } = useWeather();
  const { formatHumidity, formatWindSpeed, formatAirQuality } = useWeatherFormat();

  if (nowLoading || airQualityLoading) {
    return (
      <div className="grid grid-cols-4 gap-4 p-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-3 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
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
      <div className="bg-[#E6FCF1] rounded-sm py-4 px-1 text-[#4E4946]">
        <div className="text-center text-sm font-medium mb-1">습도</div>
        <div className="text-center font-bold">{formatHumidity(now?.humidityPct)}</div>
      </div>

      <div className="bg-[#FFEBD4] rounded-sm py-4 px-1 text-[#4E4946]">
        <div className="text-center text-sm font-medium mb-1">바람</div>
        <div className="text-center font-bold">{formatWindSpeed(now?.windMs)}</div>
      </div>

      <div className="bg-[#FFEAE5] rounded-sm py-4 px-1 text-[#4E4946]">
        <div className="text-center text-sm font-medium mb-1">미세먼지</div>
        <div className="text-center font-bold">{pm10Display}</div>
        <div className="text-center mt-1">
          <AirQualityBadge grade={pm10Grade} size="sm" />
        </div>
      </div>
      <div className="bg-[#FFEAE5] rounded-sm py-4 px-1 text-[#4E4946]">
        <div className="text-center text-sm font-medium mb-1">초미세먼지</div>
        <div className="text-center font-bold">{pm25Display}</div>
        <div className="text-center mt-1">
          <AirQualityBadge grade={pm25Grade} size="sm" />
        </div>
      </div>
    </div>
  );
}

function CurrentWeatherCard() {
  const { now, nowLoading, isOnline } = useWeather();
  const { formatTemperature } = useWeatherFormat();
  const { getIconName, getConditionText } = useWeatherIcon();
  const { diff: tempDiff, isLoading: tempDiffLoading } = useYesterdayTemperatureComparison();

  if (nowLoading) {
    return (
      <div className="mx-4 mb-6 bg-white rounded-xl p-6 shadow-sm animate-pulse">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 bg-gray-200 rounded mb-2 w-24"></div>
            <div className="h-8 bg-gray-200 rounded mb-1 w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!now) {
    const message = isOnline
      ? "날씨 정보를 불러올 수 없습니다"
      : "오프라인 중입니다. 마지막으로 캐시된 데이터를 확인하세요";

    return (
      <div className="mx-4 mb-6 bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">{message}</p>
          </div>
        </div>
      </div>
    );
  }

  const iconName = getIconName(now?.weatherCode?.pty, now?.weatherCode?.sky);
  const conditionText = getConditionText(now?.weatherCode?.pty, now?.weatherCode?.sky);

  return (
    <div className="mb-7">
      <div className="flex items-center justify-center gap-5">
        {/* 날씨 아이콘 - 임시로 텍스트로 표시 */}
        <div className="text-6xl">
          {iconName === "sun" && "☀️"}
          {iconName === "cloud" && "☁️"}
          {iconName === "cloud-rain" && "🌧️"}
          {iconName === "cloud-snow" && "❄️"}
          {!["sun", "cloud", "cloud-rain", "cloud-snow"].includes(iconName) && "☀️"}
        </div>
        <div>
          <p className="text-4xl font-black text-[#3A3431]">{formatTemperature(now?.tempC)}</p>
          <p className="text-gray-600">
            <span className="after:content['|'] after:mx-1 after:text-sm after:text-[#615D5A]">
              {conditionText}
            </span>
            <span>
              {tempDiffLoading
                ? "어제 데이터 확인중..."
                : tempDiff !== undefined
                ? `어제보다 ${Math.abs(tempDiff)}° ${
                    tempDiff > 0 ? "높음" : tempDiff < 0 ? "낮음" : "같음"
                  }`
                : "어제 데이터 준비중"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function WeatherCharts() {
  const { daily } = useWeather();

  return (
    <div className="">
      {/* 7일 일별 날씨 예보 */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">7일 예보</h3>

        <DailyList
          points={daily ?? []}
          maxItems={7}
          showPrecipitation={true}
          showHumidity={false}
        />
      </div>
    </div>
  );
}

export function Weather() {
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
