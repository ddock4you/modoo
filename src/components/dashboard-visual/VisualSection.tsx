import { useQuery } from "@tanstack/react-query";
import { useStorage } from "../../lib/storage/useStorage";
import { usePlantsStatusStats, getStatusLabel } from "../../lib/storage/usePlantStatus";
import { useWeatherSummary, useWeatherFormat } from "../../lib/weather/useWeather";
import { useLocationSearch } from "../../lib/weather/useLocationSearch";
import visualFlowerImage from "../../assets/images/visual_flower.png";
import { LocationSection } from "./LocationSection";
import { MainMessageSection } from "./MainMessageSection";
import { DonutChartSection } from "./DonutChartSection";
import { WeatherSection } from "./WeatherSection";
import { LastWateringSection } from "./LastWateringSection";
/**
 * 마지막 물준 날짜를 계산하는 헬퍼 함수
 * 모든 식물의 물주기 이벤트 중 가장 최근 날짜를 반환
 */
function useLastWateringDate() {
  const storage = useStorage();

  return useQuery({
    queryKey: ["lastWateringDate"],
    queryFn: async (): Promise<{ daysAgo: number; message: string } | null> => {
      const events = await storage.listTaskEvents(undefined, "water");

      if (events.length === 0) {
        return null;
      }

      // 모든 식물의 물주기 이벤트 중 가장 최근 날짜 찾기
      const latestEvent = events.reduce((prev, current) =>
        current.doneAt > prev.doneAt ? current : prev
      );

      const now = Date.now();
      const diffMs = now - latestEvent.doneAt;
      const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

      // 모든 식물에 물을 줬는지 확인 (각 식물별로 최근 물주기 이벤트가 있는지)
      const plants = await storage.listPlants();
      const plantIds = new Set(plants.map((p) => p.id));
      const plantWateringDates = new Map<string, number>();

      events.forEach((event) => {
        const existing = plantWateringDates.get(event.plantId);
        if (!existing || event.doneAt > existing) {
          plantWateringDates.set(event.plantId, event.doneAt);
        }
      });

      // 모든 식물이 같은 날에 물을 받았는지 확인 (같은 날짜 범위 내)
      const allWateredSameDay = Array.from(plantWateringDates.values()).every((date) => {
        const dayDiff = Math.abs(date - latestEvent.doneAt);
        return dayDiff < 24 * 60 * 60 * 1000; // 24시간 이내
      });

      if (allWateredSameDay && plantWateringDates.size === plantIds.size) {
        // 모든 식물에 같은 날 물을 줌
        if (diffDays === 0) {
          return { daysAgo: 0, message: "오늘 모든 화분에 물을 주었습니다." };
        } else if (diffDays === 1) {
          return { daysAgo: 1, message: "어제 모든 화분에 물을 주었습니다." };
        } else {
          return { daysAgo: diffDays, message: `${diffDays}일 전에 모든 화분에 물을 주었습니다.` };
        }
      }

      // 일부만 물을 줬거나 다른 날짜에 물을 준 경우
      if (diffDays === 0) {
        return { daysAgo: 0, message: "오늘 물을 주었습니다." };
      } else if (diffDays === 1) {
        return { daysAgo: 1, message: "어제 물을 주었습니다." };
      } else {
        return { daysAgo: diffDays, message: `${diffDays}일 전에 물을 주었습니다.` };
      }
    },
  });
}

/**
 * 도넛 차트 데이터를 준비하는 함수
 */
function prepareChartData(stats: ReturnType<typeof usePlantsStatusStats>["data"]) {
  if (!stats) return [];

  const goodPercentage = stats.goodPercentage ?? 0;
  return [
    { name: "양호", value: goodPercentage, color: "#24D17E" },
    { name: "나머지", value: 100 - goodPercentage, color: "#E5E7EB" },
  ].filter((item) => item.value > 0); // 값이 0인 항목 제외
}

/**
 * 상태 라벨을 결정하는 함수
 * 양호가 있으면 양호, 없으면 가장 나쁜 상태를 반환
 */
function getStatusLabelFromStats(stats: ReturnType<typeof usePlantsStatusStats>["data"]): string {
  if (!stats) return "상태 없음";

  const status: "good" | "warning" | "danger" | null =
    stats.good > 0 ? "good" : stats.warning > 0 ? "warning" : stats.danger > 0 ? "danger" : null;

  return getStatusLabel(status);
}

/**
 * 메인 메시지를 결정하는 함수
 * 상태에 따라 동적으로 변경
 */
function getMainMessage(stats: ReturnType<typeof usePlantsStatusStats>["data"]): string {
  if (!stats) return "화분이 잘 관리되고 있어요";

  // 위험 상태의 화분이 하나 이상 있을 경우 (주의 화분은 무시)
  if (stats.danger > 0) {
    return `위험한 상태의 화분이 ${stats.danger}개 있어요!`;
  }

  // 주의 상태의 화분이 하나라도 있을 경우 (위험 없을 때)
  if (stats.warning > 0) {
    return `주의깊게 봐야 할 화분이 ${stats.warning}개 있어요!`;
  }

  // 그 외 (모두 양호 또는 상태 없음)
  return "화분이 잘 관리되고 있어요";
}

export function VisualSection() {
  // ========== 데이터 로딩 상태 ==========
  const { data: stats, isLoading: statsLoading } = usePlantsStatusStats();
  const { data: lastWatering, isLoading: lastWateringLoading } = useLastWateringDate();
  const weatherSummary = useWeatherSummary();
  const { formatTemperature, formatHumidity } = useWeatherFormat();

  // 위치 탐색 훅 사용 (날씨 위치 업데이트 포함, 에러 자동 제거)
  const {
    searchLocation,
    isLoading: isLocating,
    error: locationError,
  } = useLocationSearch({
    updateWeatherLocation: true,
    autoClearError: true,
    errorClearDelay: 5000,
  });

  // ========== 계산된 값 ==========
  const chartData = prepareChartData(stats);
  const statusLabel = getStatusLabelFromStats(stats);
  const mainMessage = getMainMessage(stats);

  // ========== UI 렌더링 ==========
  return (
    <div
      className="relative overflow-hidden py-5 bg-[#FFFAE3]"
      style={{
        backgroundImage: `url(${visualFlowerImage})`,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "bottom",
      }}
    >
      <div className="relative flex flex-col items-center">
        {/* 위치 정보 섹션 */}
        <LocationSection
          locationName={weatherSummary.location?.name}
          isLocating={isLocating}
          locationError={locationError}
          onSearchLocation={searchLocation}
        />

        {/* 메인 메시지 섹션 */}
        <MainMessageSection message={mainMessage} />

        {/* 도넛 차트 섹션 */}
        <div className="flex items-center justify-center mb-5">
          <div className="relative w-40 h-40">
            <DonutChartSection
              isLoading={statsLoading}
              chartData={chartData}
              statusLabel={statusLabel}
            />
          </div>
        </div>

        {/* 날씨 정보 섹션 */}
        <WeatherSection
          temperature={weatherSummary.temperature}
          humidity={weatherSummary.humidity}
          formatTemperature={formatTemperature}
          formatHumidity={formatHumidity}
        />

        {/* 마지막 물준 날짜 섹션 */}
        <LastWateringSection isLoading={lastWateringLoading} lastWatering={lastWatering} />
      </div>
    </div>
  );
}
