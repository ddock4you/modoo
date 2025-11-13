/**
 * WeatherWidget 컴포넌트
 * 대시보드용 날씨 요약 위젯
 */

import { Link } from "react-router-dom";
import { ChevronRight, RefreshCw, Wifi, WifiOff, ArrowDown, ArrowUp } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
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
  const { formatTemperature, formatHumidity } = useWeatherFormat();
  const hourlyWeather = useHourlyWeather();

  // 시간별 온도/습도 데이터 추출 (다음 24시간) - Recharts 포맷
  const nextHours = (hourlyWeather.data || []).slice(0, 24);
  const hourlyTempData = nextHours.map((point) => ({
    label: `${new Date(point.time).getHours()}시`,
    temp: Math.round(point.tempC),
    precip: Math.round(point.precipProbPct ?? 0),
    icon: getIconName(point.pty, point.sky),
  }));
  const hourlyHumData = nextHours.map((point) => ({
    label: `${new Date(point.time).getHours()}시`,
    hum: Math.round(point.humidityPct ?? summary.humidity ?? 0),
  }));

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

      {/* 오늘의 날씨 - 온도 */}
      <div className="mb-3">
        {/* 차트 */}
        {hourlyTempData.length > 0 && (
          <div className="relative">
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={hourlyTempData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "rgb(107 114 128)" }}
                />
                <YAxis hide domain={["dataMin-2", "dataMax+2"]} />
                <Tooltip
                  cursor={{ stroke: "rgba(59,130,246,.35)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as (typeof hourlyTempData)[number];
                    return (
                      <div className="rounded-md border bg-white px-2 py-1 text-xs shadow-sm">
                        <div className="font-medium">{p.label}</div>
                        <div className="text-blue-600">{p.temp}°C</div>
                        <div className="text-gray-500">강수확률 {p.precip}%</div>
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="temp"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3, stroke: "#2563eb", fill: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
            {/* 강수확률 캡션 */}
            <div className="mt-1 flex justify-between text-[10px] text-blue-700">
              {hourlyTempData.map((p, i) => (
                <span key={i} className="w-8 text-center">{`${p.precip}%`}</span>
              ))}
            </div>
            {/* 하단 아이콘/시간 */}
            <div className="mt-2 grid grid-cols-8 text-center text-xs">
              {hourlyTempData.map((p, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="text-lg">
                    {p.icon === "sun" && "☀️"}
                    {p.icon === "cloud" && "☁️"}
                    {p.icon === "cloud-rain" && "🌧️"}
                    {p.icon === "cloud-snow" && "❄️"}
                  </div>
                  <div
                    className={`px-1.5 py-0.5 rounded ${
                      i === 0 ? "bg-blue-600 text-white" : "text-gray-600"
                    }`}
                  >
                    {i === 0 ? "지금" : p.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 상태 카드 (온도/쾌적도) */}
        <div className="mt-3 flex gap-3 rounded-lg border bg-muted/30 p-3">
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

      {/* 오늘의 습도 */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold">오늘의 습도</div>
          <Link
            to="/weather"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            자세히 보기 <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        {/* 습도 차트 */}
        {hourlyHumData.length > 0 && (
          <ResponsiveContainer width="100%" height={110}>
            <LineChart data={hourlyHumData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "rgb(107 114 128)" }}
              />
              <YAxis hide domain={[0, 100]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as (typeof hourlyHumData)[number];
                  return (
                    <div className="rounded-md border bg-white px-2 py-1 text-xs shadow-sm">
                      <div className="font-medium">{p.label}</div>
                      <div className="text-indigo-600">습도 {p.hum}%</div>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="hum"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ r: 3, stroke: "#0ea5e9", fill: "#fff", strokeWidth: 2 }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* 상태 카드 (습도) */}
        <div className="mt-3 flex gap-3 rounded-lg border bg-muted/30 p-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            😊
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">습도 {formatHumidity(humidityNow)}</span>
              {humidityNow !== undefined && summary.humidity !== undefined && (
                <span className="text-xs text-rose-600">전날보다 5% 높음</span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              식물에게 쾌적한 습도보다 현재 습도가 낮으므로 공중 습도를 한 번 체크해 주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
