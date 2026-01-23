/**
 * 날씨 컴포넌트 유틸리티 함수들
 * 모든 헬퍼 함수를 통합 관리
 */

/**
 * 날씨 아이콘명을 이모지로 변환
 */
export function getWeatherEmoji(iconName: string): string {
  const emojiMap: Record<string, string> = {
    sun: "☀️",
    cloud: "☁️",
    "cloud-rain": "🌧️",
    "cloud-snow": "❄️",
    moon: "🌙",
    "cloud-moon": "☁️",
  };
  return emojiMap[iconName] || "☀️";
}

/**
 * 습도 값에 따른 아이콘 선택
 */
export function getHumidityIcon(humidity: number): string {
  if (humidity >= 70) return "💦"; // 높음
  if (humidity >= 50) return "💧"; // 적정
  if (humidity >= 30) return "🌫️"; // 낮음
  return "🏜️"; // 매우 낮음
}

/**
 * 전날 대비 온도 차이 계산
 */
export function calculateTemperatureDiff(
  todayDaily: { minC: number; maxC: number } | undefined,
  yesterDaily: { minC: number; maxC: number } | undefined
): number | undefined {
  if (!todayDaily || !yesterDaily) return undefined;

  const todayAvg = Math.round(((todayDaily.minC + todayDaily.maxC) / 2) * 10) / 10;
  const yesterAvg = Math.round(((yesterDaily.minC + yesterDaily.maxC) / 2) * 10) / 10;

  return Math.round((todayAvg - yesterAvg) * 10) / 10;
}

/**
 * 시간대별 현재 vs 어제 온도 차이 계산 (KST 기준)
 */
export function calculateHourlyTemperatureDiff(
  currentTemp: number,
  yesterdayHourly: Array<{ time: string; tempC?: number }>,
  currentTime?: Date
): number | undefined {
  if (!yesterdayHourly || yesterdayHourly.length === 0) return undefined;

  // 현재 시간을 KST로 변환
  const now = currentTime || new Date();
  const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000); // UTC+9
  const currentHour = kstTime.getHours();

  // 어제 같은 시간대의 데이터 찾기 (가장 가까운 시간대 우선)
  let closestPoint: { time: string; tempC?: number } | undefined;
  let minDiff = Infinity;

  for (const point of yesterdayHourly) {
    const pointTime = new Date(point.time);
    const pointHour = pointTime.getHours();
    const hourDiff = Math.abs(currentHour - pointHour);

    if (hourDiff < minDiff && point.tempC !== undefined) {
      minDiff = hourDiff;
      closestPoint = point;
    }
  }

  if (!closestPoint || closestPoint.tempC === undefined) return undefined;

  // 현재 온도와 어제 같은 시간대 온도의 차이 계산
  const diff = currentTemp - closestPoint.tempC;
  return Math.round(diff * 10) / 10; // 소수점 첫째자리까지
}

/**
 * 쾌적도 계산 (온도/습도 범위 체크)
 */
export function calculateComfortLevel(
  temp: number | undefined,
  humidity: number | undefined
): { label: "쾌적" | "주의"; message: string } {
  const isComfortTemp = temp !== undefined && temp >= 18 && temp <= 24;
  const isComfortHum = humidity !== undefined && humidity >= 40 && humidity <= 60;

  const label = isComfortTemp && isComfortHum ? "쾌적" : "주의";
  const message =
    label === "쾌적"
      ? "햇살이 강하지 않은 적정 온도의 기온으로 쾌적한 온도가 유지되겠습니다."
      : "식물에게 쾌적한 범위를 벗어난 환경일 수 있어 상태를 확인해 주세요.";

  return { label, message };
}

/**
 * 날짜 문자열 생성 (오늘/어제)
 */
export function getDateStrings(): { today: string; yesterday: string } {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return { today, yesterday };
}
