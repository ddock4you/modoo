/**
 * AirKorea 대기질 데이터 프로바이더
 * getNearbyMsrstnList + getMsrstnAcctoRltmMesureDnsty API 연동
 */

import type { AirQuality } from "../../domain/types";

// AirKorea API 응답 타입 정의
interface AirKoreaApiResponse<T> {
  response: {
    body: {
      items: T[];
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
    header: {
      resultCode: string;
      resultMsg: string;
    };
  };
}

// 근접 측정소 조회 응답 타입
interface NearbyStationItem {
  stationName: string; // 측정소명
  addr: string; // 주소
  tm: number; // TM 좌표계 기준 거리
  dmX: string; // DM_X좌표 (longitude)
  dmY: string; // DM_Y좌표 (latitude)
}

// 실시간 측정정보 응답 타입
interface MeasurementItem {
  dataTime: string; // 측정일시
  stationName: string; // 측정소명
  pm10Value: string; // 미세먼지(PM10) 농도
  pm25Value: string; // 초미세먼지(PM2.5) 농도
  khaiValue: string; // 통합대기환경지수
  khaiGrade: string; // 통합대기환경지수 등급
  so2Value: string; // 아황산가스 농도
  coValue: string; // 일산화탄소 농도
  o3Value: string; // 오존 농도
  no2Value: string; // 이산화질소 농도
}

// 내부 측정소 타입
interface Station {
  name: string;
  address: string;
  distance: number; // TM 좌표 거리
  lat: number;
  lon: number;
}

// CAI 등급 매핑
const CAI_GRADE_MAP = {
  "1": "좋음",
  "2": "보통",
  "3": "나쁨",
  "4": "매우나쁨",
} as const;

type CaiGradeKey = keyof typeof CAI_GRADE_MAP;

// 지역별 폴백 측정소
const FALLBACK_STATIONS = {
  seoul: "종로구",
  busan: "부산 북구",
  daegu: "대구 중구",
  incheon: "인천 중구",
  gwangju: "광주 서구",
  daejeon: "대전 서구",
  ulsan: "울산 중구",
  sejong: "세종시",
  gyeonggi: "수원시",
  gangwon: "춘천시",
  chungbuk: "청주시",
  chungnam: "천안시",
  jeonbuk: "전주시",
  jeonnam: "목포시",
  gyeongbuk: "포항시",
  gyeongnam: "창원시",
  jeju: "제주시",
} as const;

export class AirKoreaProvider {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  // 캐시 TTL 설정
  private readonly STATION_CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간
  private readonly AIR_QUALITY_CACHE_TTL = 60 * 60 * 1000; // 60분

  constructor(apiKey: string) {
    this.baseUrl = "https://apis.data.go.kr/B552584";
    this.apiKey = apiKey;
  }

  /**
   * TM 좌표 기준 근접 측정소 목록 조회
   */
  async getNearbyStations(tmX: number, tmY: number): Promise<Station[]> {
    const cacheKey = `tm_${Math.floor(tmX)}_${Math.floor(tmY)}`;

    // 캐시 확인 (실제 구현에서는 IndexedDbWeatherCache에서 확인)
    // TODO: 캐시 구현 연동

    const params = new URLSearchParams({
      serviceKey: this.apiKey,
      returnType: "json",
      tmX: tmX.toString(),
      tmY: tmY.toString(),
      ver: "1.0",
    });

    const url = `${this.baseUrl}/MsrstnInfoInqireSvc/getNearbyMsrstnList?${params}`;

    try {
      const response = await fetch(url);
      const data: AirKoreaApiResponse<NearbyStationItem> = await response.json();

      if (data.response?.header?.resultCode !== "00") {
        throw new Error(
          `AirKorea API Error: ${data.response?.header?.resultMsg || "Unknown error"}`
        );
      }

      const items = data.response?.body?.items;
      if (!items || items.length === 0) {
        throw new Error("No nearby stations found");
      }

      // 응답 데이터를 내부 타입으로 변환
      return items.map((item) => ({
        name: item.stationName,
        address: item.addr,
        distance: item.tm,
        lat: parseFloat(item.dmY),
        lon: parseFloat(item.dmX),
      }));
    } catch (error) {
      console.error("Failed to fetch nearby stations:", error);
      throw error;
    }
  }

  /**
   * 측정소명으로 실시간 대기질 정보 조회
   */
  async getAirQuality(stationName: string): Promise<AirQuality> {
    const cacheKey = `station_${stationName}`;

    // 캐시 확인 (실제 구현에서는 IndexedDbWeatherCache에서 확인)
    // TODO: 캐시 구현 연동

    const params = new URLSearchParams({
      serviceKey: this.apiKey,
      returnType: "json",
      stationName: stationName,
      dataTerm: "DAILY",
      ver: "1.0",
    });

    const url = `${this.baseUrl}/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty?${params}`;

    try {
      const response = await fetch(url);
      const data: AirKoreaApiResponse<MeasurementItem> = await response.json();

      if (data.response?.header?.resultCode !== "00") {
        throw new Error(
          `AirKorea API Error: ${data.response?.header?.resultMsg || "Unknown error"}`
        );
      }

      const items = data.response?.body?.items;
      if (!items || items.length === 0) {
        throw new Error(`No air quality data for station: ${stationName}`);
      }

      // 최신 데이터 사용 (첫 번째 항목)
      const latestData = items[0];

      const parseNumericValue = (value: string): number | null => {
        if (!value || value === "-" || value.trim() === "") return null;
        const parsed = parseInt(value);
        return isNaN(parsed) ? null : parsed;
      };

      return {
        pm10: parseNumericValue(latestData.pm10Value),
        pm25: parseNumericValue(latestData.pm25Value),
        aqiKorea: this.mapCaiGrade(latestData.khaiGrade),
        stationName: latestData.stationName,
        updatedAt: Date.now(),
      };
    } catch (error) {
      console.error(`Failed to fetch air quality for ${stationName}:`, error);
      throw error;
    }
  }

  /**
   * 좌표 기반 대기질 정보 조회 (통합 메서드)
   */
  async getAirQualityByLocation(lat: number, lon: number): Promise<AirQuality> {
    try {
      // 1. 좌표를 TM으로 변환 (coord.ts의 함수 사용)
      const { latLonToTM } = await import("./coord");
      const { tmX, tmY } = latLonToTM(lat, lon);

      // 2. 근접 측정소 검색
      const stations = await this.getNearbyStations(tmX, tmY);

      if (stations.length === 0) {
        throw new Error("No nearby air quality stations found");
      }

      // 3. 가장 가까운 측정소 선택 (거리 오름차순 정렬)
      const nearestStation = stations.sort((a, b) => a.distance - b.distance)[0];

      // 4. 해당 측정소의 대기질 데이터 조회
      return await this.getAirQuality(nearestStation.name);
    } catch (error) {
      console.error("Failed to get air quality by location:", error);

      // 폴백: 지역별 기본 측정소 시도
      try {
        const fallbackStation = this.getFallbackStation(lat, lon);
        return await this.getAirQuality(fallbackStation);
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);

        // 최종 폴백: 서울 종로구
        try {
          return await this.getAirQuality(FALLBACK_STATIONS.seoul);
        } catch (finalError) {
          console.error("Final fallback failed:", finalError);
          throw new Error("Unable to retrieve air quality data");
        }
      }
    }
  }

  /**
   * CAI 등급을 한국어로 매핑
   */
  private mapCaiGrade(grade: string): string {
    const gradeKey = grade as CaiGradeKey;
    return CAI_GRADE_MAP[gradeKey] || "알수없음";
  }

  /**
   * 좌표 기반 지역별 폴백 측정소 선택
   */
  private getFallbackStation(lat: number, lon: number): string {
    // 간단한 지역 판별 로직 (실제로는 더 정교한 지리적 판단 필요)
    // 서울 지역 (37.4-37.7, 126.7-127.2)
    if (lat >= 37.4 && lat <= 37.7 && lon >= 126.7 && lon <= 127.2) {
      return FALLBACK_STATIONS.seoul;
    }

    // 부산 지역 (35.0-35.3, 128.9-129.3)
    if (lat >= 35.0 && lat <= 35.3 && lon >= 128.9 && lon <= 129.3) {
      return FALLBACK_STATIONS.busan;
    }

    // 그 외 지역은 서울로 폴백
    return FALLBACK_STATIONS.seoul;
  }
}
