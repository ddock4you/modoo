import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import { useWeather, useWeatherFormat, useWeatherIcon, useYesterdayTemperatureComparison } from "@/features/weather/hooks/useWeather";
import { WeatherEmojiIcon } from "@/features/weather/components/page/ui/WeatherEmojiIcon";

export function CurrentWeatherCard() {
  const { now, nowLoading, isOnline } = useWeather();
  const { formatTemperature } = useWeatherFormat();
  const { getIconName, getConditionText } = useWeatherIcon();
  const { diff: tempDiff, isLoading: tempDiffLoading } = useYesterdayTemperatureComparison();

  if (nowLoading) {
    return (
      <div className="mx-4 mb-6 bg-white rounded-xl p-6 shadow-sm animate-pulse">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 bg-gray-200 rounded mb-2 w-24" />
            <div className="h-8 bg-gray-200 rounded mb-1 w-16" />
            <div className="h-4 bg-gray-200 rounded w-20" />
          </div>
          <div className="w-16 h-16 bg-gray-200 rounded-full" />
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

  const iconName = getIconName(now.weatherCode?.pty, now.weatherCode?.sky);
  const conditionText = getConditionText(now.weatherCode?.pty, now.weatherCode?.sky);

  return (
    <div className="mb-7">
      <div className="flex items-center justify-center gap-5">
        <div className="text-6xl">
          <WeatherEmojiIcon iconName={iconName} />
        </div>
        <div>
          <p className="text-4xl font-black text-[#3A3431]">{formatTemperature(now.tempC)}</p>
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
