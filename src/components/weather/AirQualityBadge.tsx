/**
 * AirQualityBadge 컴포넌트
 * 대기질 등급을 표시하는 배지 컴포넌트
 */

import type { AirQuality } from "../../domain/types";

export interface AirQualityBadgeProps {
  airQuality: AirQuality | null | undefined;
  showValues?: boolean; // PM10/PM2.5 값 표시 여부
  showStation?: boolean; // 측정소명 표시 여부
  size?: "sm" | "md" | "lg"; // 배지 크기
}

export function AirQualityBadge({
  airQuality,
  showValues = false,
  showStation = false,
  size = "md",
}: AirQualityBadgeProps) {
  // 등급별 스타일 정의
  const getGradeStyles = (grade: string | undefined) => {
    switch (grade) {
      case "좋음":
        return {
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          borderColor: "border-green-200",
          icon: "😊",
        };
      case "보통":
        return {
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-800",
          borderColor: "border-yellow-200",
          icon: "😐",
        };
      case "나쁨":
        return {
          bgColor: "bg-orange-100",
          textColor: "text-orange-800",
          borderColor: "border-orange-200",
          icon: "😷",
        };
      case "매우나쁨":
        return {
          bgColor: "bg-red-100",
          textColor: "text-red-800",
          borderColor: "border-red-200",
          icon: "🤒",
        };
      default:
        return {
          bgColor: "bg-gray-100",
          textColor: "text-gray-600",
          borderColor: "border-gray-200",
          icon: "❓",
        };
    }
  };

  // 크기별 스타일
  const getSizeStyles = (size: string) => {
    switch (size) {
      case "sm":
        return {
          container: "px-2 py-1 text-xs",
          icon: "w-3 h-3",
          spacing: "gap-1",
        };
      case "lg":
        return {
          container: "px-4 py-2 text-base",
          icon: "w-5 h-5",
          spacing: "gap-2",
        };
      default: // md
        return {
          container: "px-3 py-1.5 text-sm",
          icon: "w-4 h-4",
          spacing: "gap-1.5",
        };
    }
  };

  if (!airQuality) {
    const styles = getGradeStyles(undefined);
    const sizeStyles = getSizeStyles(size);

    return (
      <div
        className={`inline-flex items-center ${sizeStyles.container} rounded-full border ${styles.bgColor} ${styles.borderColor}`}
      >
        <span className={sizeStyles.icon}>{styles.icon}</span>
        <span className={`font-medium ${styles.textColor}`}>측정중</span>
      </div>
    );
  }

  const grade = airQuality.aqiKorea;
  const styles = getGradeStyles(grade);
  const sizeStyles = getSizeStyles(size);

  return (
    <div className={`inline-flex flex-col gap-1`}>
      {/* 메인 배지 */}
      <div
        className={`inline-flex items-center ${sizeStyles.container} rounded-full border ${styles.bgColor} ${styles.borderColor}`}
      >
        <span className={sizeStyles.icon}>{styles.icon}</span>
        <span className={`font-medium ${styles.textColor}`}>{grade || "알수없음"}</span>
      </div>

      {/* 추가 정보 */}
      {(showValues || showStation) && (
        <div className="text-xs text-gray-500 space-y-0.5">
          {showValues && (airQuality.pm10 !== null || airQuality.pm25 !== null) && (
            <div className="flex gap-2">
              {airQuality.pm10 !== null && <span>PM10: {airQuality.pm10}㎍/m³</span>}
              {airQuality.pm25 !== null && <span>PM2.5: {airQuality.pm25}㎍/m³</span>}
            </div>
          )}
          {showStation && airQuality.stationName && (
            <div className="text-center">{airQuality.stationName}</div>
          )}
        </div>
      )}
    </div>
  );
}
