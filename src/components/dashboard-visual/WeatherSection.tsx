import { Cloud } from "../icons/Cloud";
import { WaterDrop3 } from "../icons/WaterDrop3";

/**
 * 날씨 정보 섹션 컴포넌트
 * 상태: 기온 있음 / 습도 있음 / 둘 다 없음 (렌더링 안 함)
 */
export interface WeatherSectionProps {
  temperature: number | undefined;
  humidity: number | undefined;
  formatTemperature: (temp: number) => string;
  formatHumidity: (humidity: number) => string;
}

export function WeatherSection({
  temperature,
  humidity,
  formatTemperature,
  formatHumidity,
}: WeatherSectionProps) {
  // 둘 다 없으면 렌더링하지 않음
  if (temperature === undefined && humidity === undefined) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mb-3 text-sm">
      {temperature !== undefined && (
        <div className="flex items-center gap-2">
          <Cloud size={24} />
          <span className="text-[#4E4946] font-bold">기온</span>
          <span className="text-[#615D5A]">{formatTemperature(temperature)}</span>
        </div>
      )}
      {humidity !== undefined && (
        <div className="flex items-center gap-2">
          <WaterDrop3 size={20} />
          <span className="text-[#4E4946] font-bold">습도</span>
          <span className="text-[#615D5A]">{formatHumidity(humidity)}</span>
        </div>
      )}
    </div>
  );
}
