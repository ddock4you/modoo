import { Suspense } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Wifi, WifiOff, AlertCircle, RefreshCw } from "lucide-react";
import {
  useWeather,
  useWeatherLocation,
  useWeatherFormat,
  useWeatherIcon,
} from "../../lib/weather/useWeather";
import { HourlyChart } from "../../components/weather/HourlyChart";
import { HumidityChart } from "../../components/weather/HumidityChart";

function WeatherHeader() {
  const { location, isOnline } = useWeather();
  const { formatTime } = useWeatherFormat();

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 -m-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">날씨</h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{location?.name || "위치 정보 없음"}</span>
              <div className="flex items-center gap-1">
                {isOnline ? (
                  <Wifi className="w-3 h-3 text-green-500" />
                ) : (
                  <WifiOff className="w-3 h-3 text-red-500" />
                )}
                <span className="text-xs">{formatTime(Date.now())}</span>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
          title="새로고침"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}

function WeatherKPIs() {
  const { now, airQuality, nowLoading, airQualityLoading } = useWeather();
  const { formatTemperature, formatHumidity, formatWindSpeed, formatAirQuality } =
    useWeatherFormat();

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

  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      <div className="bg-blue-50 rounded-lg p-3">
        <div className="text-sm text-blue-600 font-medium mb-1">습도</div>
        <div className="text-lg font-semibold text-blue-900">
          {formatHumidity(now?.humidityPct)}
        </div>
      </div>

      <div className="bg-green-50 rounded-lg p-3">
        <div className="text-sm text-green-600 font-medium mb-1">바람</div>
        <div className="text-lg font-semibold text-green-900">{formatWindSpeed(now?.windMs)}</div>
      </div>

      <div className="bg-purple-50 rounded-lg p-3">
        <div className="text-sm text-purple-600 font-medium mb-1">대기질</div>
        <div className="text-lg font-semibold text-purple-900">
          {formatAirQuality(airQuality?.aqiKorea, airQuality?.pm25)}
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
    <div className="mx-4 mb-6 bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">현재 날씨</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{formatTemperature(now?.tempC)}</p>
          <p className="text-gray-600">{conditionText}</p>
        </div>

        {/* 날씨 아이콘 - 임시로 텍스트로 표시 */}
        <div className="text-6xl">
          {iconName === "sun" && "☀️"}
          {iconName === "cloud" && "☁️"}
          {iconName === "cloud-rain" && "🌧️"}
          {iconName === "cloud-snow" && "❄️"}
          {!["sun", "cloud", "cloud-rain", "cloud-snow"].includes(iconName) && "☀️"}
        </div>
      </div>
    </div>
  );
}

function WeatherCharts() {
  const { hourly, daily } = useWeather();
  const { getIconName } = useWeatherIcon();
  const { formatTemperature } = useWeatherFormat();

  return (
    <div className="px-4 space-y-6">
      {/* 24시간 시간별 날씨 예보 */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">24시간 예보</h3>

        {/* 시간대별 날씨 차트 */}
        {(hourly || []).length > 0 && (
          <div className="mb-4">
            <HourlyChart
              points={hourly}
              height={120}
              showTemperature={true}
              showHumidity={false}
              showPrecipitation={true}
            />
          </div>
        )}

        {/* 시간대별 날씨 아이콘 그리드 */}
        {(hourly || []).length > 0 && (
          <div className="grid grid-cols-8 gap-1 text-center">
            {(hourly || []).slice(0, 24).map((point, i) => {
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
                  <div className="text-[10px] text-gray-500">{i === 0 ? "지금" : `${hour}시`}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7일 일별 날씨 예보 */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">7일 예보</h3>

        <div className="space-y-3">
          {(daily || []).slice(0, 7).map((day, index) => {
            const date = new Date(day.date);
            const isToday = date.toDateString() === new Date().toDateString();
            const dayName = isToday
              ? "오늘"
              : date.toLocaleDateString("ko-KR", { weekday: "short" });
            const dateStr = date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });

            // 오전/오후 온도
            // - 0~2일(단기예보): minC / maxC 는 각각 오전/오후 평균값
            // - 3~7일(중기예보): minC / maxC 는 일별 최저/최고 기온
            const morningTemp = Math.round(day.minC);
            const afternoonTemp = Math.round(day.maxC);

            const morningIcon = getIconName(day.pty, day.sky);
            const afternoonIcon = getIconName(day.pty, day.sky);

            return (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
              >
                {/* 날짜와 요일 */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-sm font-medium text-gray-900 min-w-[40px]">{dayName}</div>
                  <div className="text-sm text-gray-600">{dateStr}</div>
                </div>

                {/* 강수량 */}
                <div className="text-sm text-blue-600 min-w-[35px] text-center">
                  {day.precipProbMaxPct ? `${day.precipProbMaxPct}%` : "0%"}
                </div>

                {/* 오전 온도 */}
                <div className="flex items-center gap-1 min-w-[50px] justify-center">
                  <span className="text-sm">
                    {morningIcon === "sun" && "☀️"}
                    {morningIcon === "cloud" && "☁️"}
                    {morningIcon === "cloud-rain" && "🌧️"}
                    {morningIcon === "cloud-snow" && "❄️"}
                    {!morningIcon && "☀️"}
                  </span>
                  <span className="text-sm font-medium text-gray-700">{morningTemp}°</span>
                </div>

                {/* 오후 온도 */}
                <div className="flex items-center gap-1 min-w-[50px] justify-center">
                  <span className="text-sm">
                    {afternoonIcon === "sun" && "☀️"}
                    {afternoonIcon === "cloud" && "☁️"}
                    {afternoonIcon === "cloud-rain" && "🌧️"}
                    {afternoonIcon === "cloud-snow" && "❄️"}
                    {!afternoonIcon && "☀️"}
                  </span>
                  <span className="text-sm font-medium text-gray-700">{afternoonTemp}°</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 24시간 습도 추이 */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">습도 추이</h3>

        {/* 습도 차트 */}
        {(hourly || []).length > 0 && (
          <div className="mb-4">
            <HumidityChart points={hourly} height={120} showOptimalRange={true} />
          </div>
        )}

        {/* 시간대별 습도 아이콘 그리드 */}
        {(hourly || []).length > 0 && (
          <div className="grid grid-cols-8 gap-1 text-center">
            {(hourly || []).slice(0, 24).map((point, i) => {
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
                  <div className="text-[10px] text-gray-500">{humidity}%</div>
                  <div className="text-[10px] text-gray-500">{i === 0 ? "지금" : `${hour}시`}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function WeatherStatusCard() {
  const { isOnline, error, hasData } = useWeather();

  if (!isOnline) {
    return (
      <div className="mx-4 mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <WifiOff className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-900">오프라인 상태</p>
            <p className="text-sm text-yellow-700">네트워크 연결을 확인해주세요</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-4 mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="font-medium text-red-900">데이터 로드 실패</p>
            <p className="text-sm text-red-700">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="mx-4 mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
          <div>
            <p className="font-medium text-blue-900">데이터 로딩 중</p>
            <p className="text-sm text-blue-700">날씨 정보를 불러오고 있습니다</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export function Weather() {
  return (
    <div className="min-h-screen bg-gray-50">
      <WeatherHeader />
      <main className="pb-6">
        <WeatherStatusCard />
        <CurrentWeatherCard />
        <WeatherKPIs />
        <WeatherCharts />
      </main>
    </div>
  );
}
