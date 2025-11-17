export type TaskType = "water";

export interface Plant {
  id: string;
  name: string;
  adoptedAt: number; // epoch ms
  humidity: { min: number; max: number } | null; // 습도 범위
  temperature: { min: number; max: number } | null; // 온도 범위
  lightLevel: "low" | "medium" | "high" | null; // 채광량
  isSensitive: boolean; // 예민함 여부 (기본값: false)
  notes: string;
  coverPhotoUri: string;
  createdAt: number;
  updatedAt: number;
}

export interface TaskRule {
  id: string;
  plantId: string;
  type: TaskType;
  intervalDays: number;
  lastDoneAt: number | null;
  nextDueAt: number;
  note: string;
  active: 0 | 1;
  createdAt: number;
  updatedAt: number;
}

export interface TaskEvent {
  id: string;
  plantId: string;
  type: "water"; // 우선은 물주기만 사용
  doneAt: number;
  note: string;
  createdAt: number;
}

export interface PhotoMeta {
  id: string;
  plantId: string;
  uri: string;
  thumbUri: string;
  width: number;
  height: number;
  size: number;
  createdAt: number;
  updatedAt: number;
  // 대표 사진 표시용 설정 (선택적)
  displayWidth?: number; // 표시용 너비
  displayHeight?: number; // 표시용 높이
  aspectRatio?: number; // 표시 비율
  cropArea?: {
    // 크롭 영역
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface SettingKV {
  key: string;
  value: string; // JSON string
  createdAt: number;
  updatedAt: number;
}

// ID 생성 헬퍼 함수 - crypto.randomUUID() 폴백 지원
export const generateId = (): string => {
  // crypto.randomUUID()가 지원되는 경우 사용
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // 폴백: UUID v4 수동 생성 (RFC 4122 준수)
  // 모바일 파이어폭스에선 crypto.randomUUID() 지원되지 않는 문제 확인
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// 기본값 헬퍼 함수들
export const createPlantDefaults = () => ({
  humidity: null,
  temperature: null,
  lightLevel: null as "low" | "medium" | "high" | null,
  isSensitive: false,
  notes: "",
  coverPhotoUri: "",
});

export const createTimestampFields = () => ({
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

// Weather 관련 타입들
export interface WeatherLocation {
  id: string; // e.g., "37.57,126.98"
  name: string; // 역지오코딩 or 사용자가 입력
  lat: number;
  lon: number;
  nx: number; // KMA DFS 격자
  ny: number;
  tmX: number; // AirKorea TM (EPSG:5181)
  tmY: number;
  timezone: "Asia/Seoul";
  updatedAt?: number;
}

export interface WeatherNow {
  tempC: number;
  humidityPct: number;
  windMs: number;
  precipProbPct?: number;
  weatherCode: { sky?: 1 | 3 | 4; pty?: 0 | 1 | 2 | 3 | 5 | 6 | 7 };
  updatedAt: number;
}

export interface WeatherHourlyPoint {
  time: string; // ISO
  tempC: number;
  humidityPct?: number;
  precipProbPct?: number;
  sky?: 1 | 3 | 4;
  pty?: 0 | 1 | 2 | 3 | 5 | 6 | 7;
}

export interface WeatherDailyPoint {
  date: string; // yyyy-mm-dd
  minC: number;
  maxC: number;
  precipProbMaxPct?: number;
  sky?: 1 | 3 | 4;
  pty?: 0 | 1 | 2 | 3 | 5 | 6 | 7;
  humidityPct?: number;
}

export interface AirQuality {
  pm10: number | null; // µg/m³
  pm25: number | null; // µg/m³
  aqiKorea?: string; // "좋음"|"보통"|"나쁨"|"매우나쁨" (통합대기환경지수 등급)
  stationName?: string;
  updatedAt: number;
}

export interface WeatherSummary {
  comfort: "쾌적" | "주의" | "위험";
  diffTempVsYesterday?: number;
  message: string;
}

// 차트 컴포넌트용 데이터 구조
export interface WeatherChartData {
  hourly24h: WeatherHourlyPoint[]; // 대시보드/상세페이지 공용 24시간 hourly 데이터
  daily7d: WeatherDailyPoint[]; // 상세페이지 전용 7일 daily 데이터
}

// Weather Cache Entry Types (IndexedDB 스토어용)
export interface WeatherNowCacheEntry {
  locationId: string;
  baseTime: number; // 발표시간
  data: WeatherNow;
  expiresAt: number; // 캐시 만료 시간
}

export interface WeatherHourlyCacheEntry {
  locationId: string;
  baseTime: number; // 발표시간
  data: WeatherHourlyPoint[];
  expiresAt: number; // 캐시 만료 시간
}

export interface WeatherDailyCacheEntry {
  locationId: string;
  baseTime: number; // 발표시간
  data: WeatherDailyPoint[];
  expiresAt: number; // 캐시 만료 시간
}

export interface AirQualityCacheEntry {
  locationId: string;
  baseTime: number; // 발표시간
  data: AirQuality;
  expiresAt: number; // 캐시 만료 시간
}

export interface WeatherCacheEntry {
  locationId: string;
  baseTime: number;
  data: WeatherNow | WeatherHourlyPoint[] | WeatherDailyPoint[] | AirQuality;
  expiresAt: number;
}
