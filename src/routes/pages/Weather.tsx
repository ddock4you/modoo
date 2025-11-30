import { AlertCircle } from "lucide-react";
import { useWeather, useWeatherFormat, useWeatherIcon } from "../../lib/weather/useWeather";
import { DailyList } from "../../components/weather/lists/DailyList";
import { LocationSection } from "@/components/dashboard-visual/LocationSection";
import { useLocationSearch } from "@/lib/weather/useLocationSearch";
import { WeatherWidget } from "@/components/weather/widget/WeatherWidget";

// 대기질 등급에 따른 색상 컴포넌트
function AirQualityBadge({ grade }: { grade: string }) {
  const getColorClass = (grade: string) => {
    switch (grade) {
      case "좋음":
        return "bg-[#06AC7D]";
      case "보통":
        return "bg-yellow-500";
      case "나쁨":
        return "bg-orange-500";
      case "매우나쁨":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <span className={`px-2 py-1 rounded-sm text-white text-sm ${getColorClass(grade)}`}>
      {grade}
    </span>
  );
}

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
      <div className="grid grid-cols-3 gap-4 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-3 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }
  console.log({ airQuality });
  return (
    <div className="grid grid-cols-4 gap-4 mb-12">
      <div className="bg-[#E6FCF1] rounded-sm py-4 px-1 text-[#4E4946]">
        <div className="text-center text-sm font-medium mb-1">습도</div>
        <div className="text-center font-bold">{formatHumidity(now?.humidityPct)}</div>
        <div className="flex justify-center">
          <span className="px-2 py-1 rounded-sm text-white text-sm bg-[#06AC7D]">aa</span>
        </div>
      </div>

      <div className="bg-[#FFEBD4] rounded-sm py-4 px-1 text-[#4E4946]">
        <div className="text-center text-sm font-medium mb-1">바람</div>
        <div className="text-center font-bold">{formatWindSpeed(now?.windMs)}</div>
      </div>

      <div className="bg-[#FFEAE5] rounded-sm py-4 px-1 text-[#4E4946]">
        <div className="text-center text-sm font-medium mb-1">미세먼지</div>
        <div className="text-center font-bold">{airQuality?.pm10} µg/m³</div>
        <div className="text-center mt-1">
          <AirQualityBadge grade={formatAirQuality("pm10", airQuality?.pm10)} />
        </div>
      </div>
      <div className="bg-[#FFEAE5] rounded-sm py-4 px-1 text-[#4E4946]">
        <div className="text-center text-sm font-medium mb-1">초미세먼지</div>
        <div className="text-center font-bold">{airQuality?.pm25} µg/m³</div>
        <div className="text-center mt-1">
          <AirQualityBadge grade={formatAirQuality("pm25", airQuality?.pm25)} />
        </div>
      </div>
    </div>
  );
}

function CurrentWeatherCard() {
  const { now, nowLoading, isOnline } = useWeather();
  const { formatTemperature } = useWeatherFormat();
  const { getIconName, getConditionText } = useWeatherIcon();

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

  if (!now && isOnline) {
    return (
      <div className="mx-4 mb-6 bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">날씨 정보를 불러올 수 없습니다</p>
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
            <span>어제보다 1도 높아요</span>
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
