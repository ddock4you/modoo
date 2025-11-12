/**
 * WeatherWidget 컴포넌트
 * 대시보드용 날씨 요약 위젯
 */

import { Link } from "react-router-dom";
import { ChevronRight, RefreshCw, Wifi, WifiOff } from "lucide-react";
import {
  useWeatherSummary,
  useWeatherIcon,
  useWeatherFormat,
  useHourlyWeather,
  useCurrentWeather,
} from "../../lib/weather/useWeather";

export function WeatherWidget() {
  const summary = useWeatherSummary();
  const currentWeather = useCurrentWeather();
  const { getIconName, getConditionText } = useWeatherIcon();
  const { formatTemperature, formatHumidity, formatWindSpeed, formatAirQuality } =
    useWeatherFormat();
  const hourlyWeather = useHourlyWeather();

  // 시간별 온도 데이터 추출 (최근 24시간) - recharts용 포맷
  const hourlyTempData = (hourlyWeather.data || [])
    .slice(0, 24) // 최대 24시간
    .map((point) => ({
      time: `${new Date(point.time).getHours()}시`,
      temp: point.tempC,
    }));

  // 디버깅: 차트 데이터 확인
  if (import.meta.env.DEV) {
    console.log("Hourly Chart Data:", {
      rawData: hourlyWeather.data,
      processedData: hourlyTempData,
      dataLength: hourlyTempData.length,
    });
  }

  // 로딩 상태
  if (summary.isLoading) {
    return (
      <div className="bg-card text-card-foreground rounded-lg p-4 border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">날씨</h3>
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>로딩 중...</span>
          </div>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-2"></div>
          <div className="h-16 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (summary.error || !summary.hasData) {
    return (
      <div className="bg-card text-card-foreground rounded-lg p-4 border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">날씨</h3>
          {!summary.isOnline && (
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <WifiOff className="h-3 w-3" />
              <span>오프라인</span>
            </div>
          )}
        </div>
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">날씨 정보를 불러올 수 없습니다.</p>
          {summary.isOnline && (
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-primary hover:underline mt-1"
            >
              다시 시도
            </button>
          )}
        </div>
      </div>
    );
  }

  const iconName = getIconName(
    currentWeather.data?.weatherCode?.pty,
    currentWeather.data?.weatherCode?.sky
  );
  const conditionText = getConditionText(
    currentWeather.data?.weatherCode?.pty,
    currentWeather.data?.weatherCode?.sky
  );

  return (
    <div className="bg-card text-card-foreground rounded-lg p-4 border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">날씨</h3>
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          {summary.isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          <span>{summary.location?.name || "알 수 없음"}</span>
        </div>
      </div>

      {/* 현재 날씨 */}
      <div className="flex items-center gap-3 mb-3">
        <div className="text-2xl">
          {/* 아이콘 표시 - Lucide React 아이콘 사용 */}
          {iconName === "sun" && "☀️"}
          {iconName === "cloud" && "☁️"}
          {iconName === "cloud-rain" && "🌧️"}
          {iconName === "cloud-snow" && "❄️"}
        </div>
        <div className="flex-1">
          <div className="text-lg font-medium">{formatTemperature(summary.temperature)}</div>
          <div className="text-sm text-muted-foreground">{conditionText}</div>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          {summary.humidity && <div>습도 {formatHumidity(summary.humidity)}</div>}
          {summary.windSpeed && <div>바람 {formatWindSpeed(summary.windSpeed)}</div>}
        </div>
      </div>

      {/* 대기질 정보 */}
      {summary.airQualityGrade && (
        <div className="text-sm text-muted-foreground mb-3">
          대기질: {formatAirQuality(summary.airQualityGrade, summary.pm25 || undefined)}
        </div>
      )}

      {/* 시간별 온도 차트 */}
      {hourlyTempData.length > 0 && (
        <div className="mb-3">
          <div className="bg-gray-50 rounded-lg border p-2">
            <div className="text-xs text-gray-600 font-medium mb-1">시간별 온도</div>
            <div className="flex flex-wrap gap-2 text-xs">
              {hourlyTempData.slice(0, 6).map((point, index) => (
                <div key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {point.time}: {point.temp}°
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 상세보기 링크 */}
      <Link
        to="/weather"
        className="flex items-center justify-between text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded px-2 py-1 -mx-2 -my-1"
      >
        <span>상세 날씨 보기</span>
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
