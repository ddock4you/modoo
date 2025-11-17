/**
 * WeatherWidget 컴포넌트
 * 대시보드용 날씨 요약 위젯
 */

import { Link } from "react-router-dom";
import { ChevronRight, RefreshCw, Wifi, WifiOff, ArrowDown, ArrowUp } from "lucide-react";
import { HourlyChart } from "./HourlyChart";
import { HumidityChart } from "./HumidityChart";
import {
  useWeatherSummary,
  useWeatherIcon,
  useWeatherFormat,
  useHourlyWeather,
  useCurrentWeather,
  useDailyWeather,
} from "../../lib/weather/useWeather";

export function WeatherWidget() {
  const summary = useWeatherSummary();
  const currentWeather = useCurrentWeather();
  const dailyWeather = useDailyWeather();
  const { getIconName, getConditionText } = useWeatherIcon();
  const { formatTemperature } = useWeatherFormat();
  const hourlyWeather = useHourlyWeather();

  // 24시간 시간별 데이터 (이제 실제로 24시간 제공됨)
  const hourlyData = hourlyWeather.data || [];

  // 전날 대비 온도 차이 (일별 데이터가 있을 때만)
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const todayDaily = dailyWeather.data?.find((d) => d.date === todayStr);
  const yesterDaily = dailyWeather.data?.find((d) => d.date === yesterStr);
  const todayAvg = todayDaily
    ? Math.round(((todayDaily.minC + todayDaily.maxC) / 2) * 10) / 10
    : undefined;
  const yesterAvg = yesterDaily
    ? Math.round(((yesterDaily.minC + yesterDaily.maxC) / 2) * 10) / 10
    : undefined;
  const diffVsYesterday =
    todayAvg !== undefined && yesterAvg !== undefined
      ? Math.round((todayAvg - yesterAvg) * 10) / 10
      : undefined;

  // 쾌적도 간단 휴리스틱
  const tempNow = summary.temperature ?? currentWeather.data?.tempC;
  const humidityNow = summary.humidity ?? currentWeather.data?.humidityPct;
  const isComfortTemp = tempNow !== undefined && tempNow >= 18 && tempNow <= 24;
  const isComfortHum = humidityNow !== undefined && humidityNow >= 40 && humidityNow <= 60;
  const comfortLabel = isComfortTemp && isComfortHum ? "쾌적" : "주의";
  const comfortMessage =
    comfortLabel === "쾌적"
      ? "햇살이 강하지 않은 적정 온도의 기온으로 쾌적한 온도가 유지되겠습니다."
      : "식물에게 쾌적한 범위를 벗어난 환경일 수 있어 상태를 확인해 주세요.";

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

  const conditionText = getConditionText(
    currentWeather.data?.weatherCode?.pty,
    currentWeather.data?.weatherCode?.sky
  );

  return (
    <div className="bg-card text-card-foreground rounded-lg p-4 border">
      {/* 상단 상태 바 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1 text-muted-foreground text-xs">
          {summary.isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          <span className="truncate max-w-[140px]">{summary.location?.name || "현재 위치"}</span>
        </div>
        <Link
          to="/weather"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          오늘의 날씨 <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* 시간대별 날씨 예보 */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold">시간대별 날씨 예보</div>
        </div>

        {/* 시간대별 날씨 차트 (24시간) */}
        {hourlyData.length > 0 && (
          <div className="mb-3">
            <HourlyChart
              points={hourlyData}
              height={120}
              showTemperature={true}
              showHumidity={false}
              showPrecipitation={true}
            />
          </div>
        )}

        {/* 시간대별 날씨를 아이콘으로 표시 */}
        {hourlyData.length > 0 && (
          <div className="grid grid-cols-8 gap-1 text-center">
            {hourlyData.slice(0, 24).map((point, i) => {
              const time = new Date(point.time);
              const hour = time.getHours();
              const iconName = getIconName(point.pty, point.sky);

              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="text-lg">
                    {iconName === "sun" && "☀️"}
                    {iconName === "cloud" && "☁️"}
                    {iconName === "cloud-rain" && "🌧️"}
                    {iconName === "cloud-snow" && "❄️"}
                    {iconName === "moon" && "🌙"}
                    {iconName === "cloud-moon" && "☁️"}
                    {!iconName && "☀️"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {i === 0 ? "지금" : `${hour}시`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 시간대별 습도 예보 */}
      <div className="mb-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold">시간대별 습도 예보</div>
        </div>

        {/* 시간대별 습도 차트 (24시간) */}
        {hourlyData.length > 0 && (
          <div className="mb-3">
            <HumidityChart points={hourlyData} height={120} showOptimalRange={true} />
          </div>
        )}

        {/* 시간대별 습도의 양을 아이콘으로 표시 */}
        {hourlyData.length > 0 && (
          <div className="grid grid-cols-8 gap-1 text-center">
            {hourlyData.slice(0, 24).map((point, i) => {
              const time = new Date(point.time);
              const hour = time.getHours();
              const humidity = point.humidityPct ?? 50;

              // 습도에 따른 아이콘 선택
              let humidityIcon = "💧"; // 기본
              if (humidity >= 70) humidityIcon = "💦"; // 높음
              else if (humidity >= 50) humidityIcon = "💧"; // 적정
              else if (humidity >= 30) humidityIcon = "🌫️"; // 낮음
              else humidityIcon = "🏜️"; // 매우 낮음

              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="text-lg">{humidityIcon}</div>
                  <div className="text-[10px] text-muted-foreground">{humidity}%</div>
                  <div className="text-[10px] text-muted-foreground">
                    {i === 0 ? "지금" : `${hour}시`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 상태 카드 (온도/쾌적도) */}
      <div className="flex gap-3 rounded-lg border bg-muted/30 p-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-lg ${
            comfortLabel === "쾌적" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {comfortLabel === "쾌적" ? "🌤️" : "⚠️"}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">
              {formatTemperature(tempNow)} {conditionText}
            </span>
            {diffVsYesterday !== undefined && (
              <span
                className={`inline-flex items-center gap-0.5 text-xs ${
                  diffVsYesterday > 0 ? "text-rose-600" : "text-blue-600"
                }`}
              >
                {diffVsYesterday > 0 ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                전날보다 {Math.abs(diffVsYesterday)}° {diffVsYesterday > 0 ? "높음" : "낮음"}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{comfortMessage}</p>
        </div>
      </div>
    </div>
  );
}
