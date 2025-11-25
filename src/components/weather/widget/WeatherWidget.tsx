/**
 * WeatherWidget 컴포넌트
 * 대시보드용 날씨 요약 위젯
 */

import {
  useWeatherSummary,
  useWeatherIcon,
  useWeatherFormat,
  useHourlyWeather,
  useCurrentWeather,
  useDailyWeather,
} from "@/lib/weather/useWeather";
import { WeatherLoadingState } from "./states/WeatherLoadingState";
import { WeatherErrorState } from "./states/WeatherErrorState";
import { WeatherSuccessState } from "./states/WeatherSuccessState";

export function WeatherWidget() {
  const summary = useWeatherSummary();
  const currentWeather = useCurrentWeather();
  const dailyWeather = useDailyWeather();
  const { getIconName, getConditionText } = useWeatherIcon();
  const { formatTemperature } = useWeatherFormat();
  const hourlyWeather = useHourlyWeather();

  // 24시간 시간별 데이터
  const hourlyData = hourlyWeather.data || [];

  // 상태별 분기
  if (summary.isLoading) {
    return <WeatherLoadingState />;
  }

  if (summary.error || !summary.hasData) {
    return <WeatherErrorState error={summary.error} isOnline={summary.isOnline} />;
  }

  return (
    <WeatherSuccessState
      hourlyData={hourlyData}
      currentWeather={{
        data: currentWeather.data
          ? {
              tempC: currentWeather.data.tempC,
              humidityPct: currentWeather.data.humidityPct,
              weatherCode: currentWeather.data.weatherCode,
            }
          : undefined,
      }}
      dailyWeather={{
        data: dailyWeather.data || undefined,
      }}
      summary={summary}
      getIconName={getIconName}
      getConditionText={getConditionText}
      formatTemperature={formatTemperature}
    />
  );
}
