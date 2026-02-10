/**
 * AirKorea 대기질 데이터 프로바이더
 * getNearbyMsrstnList + getMsrstnAcctoRltmMesureDnsty API 연동
 */

import type { AirQuality } from "@/domain/types";

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

interface NearbyStationItem {
  stationName: string;
  addr: string;
  tm: number;
  dmX: string;
  dmY: string;
}

interface MeasurementItem {
  dataTime: string;
  stationName: string;
  pm10Value: string;
  pm25Value: string;
  khaiValue: string;
  khaiGrade: string;
  so2Value: string;
  coValue: string;
  o3Value: string;
  no2Value: string;
}

interface Station {
  name: string;
  address: string;
  distance: number;
  lat: number;
  lon: number;
}

const CAI_GRADE_MAP = {
  "1": "좋음",
  "2": "보통",
  "3": "나쁨",
  "4": "매우나쁨",
} as const;

type CaiGradeKey = keyof typeof CAI_GRADE_MAP;

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

  constructor(apiKey: string) {
    this.baseUrl = "https://apis.data.go.kr/B552584";
    this.apiKey = apiKey;
  }

  async getNearbyStations(tmX: number, tmY: number): Promise<Station[]> {
    const params = new URLSearchParams({
      serviceKey: this.apiKey,
      returnType: "json",
      tmX: tmX.toString(),
      tmY: tmY.toString(),
      ver: "1.0",
    });

    const url = `${this.baseUrl}/MsrstnInfoInqireSvc/getNearbyMsrstnList?${params}`;

    const response = await fetch(url);
    const data: AirKoreaApiResponse<NearbyStationItem> = await response.json();

    if (data.response?.header?.resultCode !== "00") {
      throw new Error(`AirKorea API Error: ${data.response?.header?.resultMsg || "Unknown error"}`);
    }

    const items = data.response?.body?.items;
    const itemsArray = Array.isArray(items) ? items : items ? [items] : [];

    if (itemsArray.length === 0) {
      throw new Error("No nearby stations found");
    }

    return itemsArray.map((item) => ({
      name: item.stationName,
      address: item.addr,
      distance: item.tm,
      lat: parseFloat(item.dmY),
      lon: parseFloat(item.dmX),
    }));
  }

  async getAirQuality(stationName: string): Promise<AirQuality> {
    const params = new URLSearchParams({
      serviceKey: this.apiKey,
      returnType: "json",
      stationName,
      dataTerm: "DAILY",
      ver: "1.0",
    });

    const url = `${this.baseUrl}/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty?${params}`;

    const response = await fetch(url);
    const data: AirKoreaApiResponse<MeasurementItem> = await response.json();

    if (data.response?.header?.resultCode !== "00") {
      throw new Error(`AirKorea API Error: ${data.response?.header?.resultMsg || "Unknown error"}`);
    }

    const items = data.response?.body?.items;
    const itemsArray = Array.isArray(items) ? items : items ? [items] : [];

    if (itemsArray.length === 0) {
      throw new Error(`No air quality data for station: ${stationName}`);
    }

    const latestData = itemsArray[0];

    const parseNumericValue = (value: string): number | null => {
      if (!value || value === "-" || value.trim() === "") return null;
      const parsed = parseInt(value, 10);
      return Number.isNaN(parsed) ? null : parsed;
    };

    return {
      pm10: parseNumericValue(latestData.pm10Value),
      pm25: parseNumericValue(latestData.pm25Value),
      aqiKorea: this.mapCaiGrade(latestData.khaiGrade),
      stationName: latestData.stationName,
      updatedAt: Date.now(),
    };
  }

  async getAirQualityByLocation(lat: number, lon: number): Promise<AirQuality> {
    try {
      // Keep dynamic import so tests can mock coordinate conversion.
      const { latLonToTM } = await import("@/lib/weather/coord");
      const { tmX, tmY } = latLonToTM(lat, lon);
      const stations = await this.getNearbyStations(tmX, tmY);
      if (stations.length === 0) {
        throw new Error("No nearby air quality stations found");
      }

      const nearestStation = stations.slice().sort((a: Station, b: Station) => a.distance - b.distance)[0];
      return await this.getAirQuality(nearestStation.name);
    } catch (error) {
      console.error("Failed to get air quality by location:", error);

      try {
        const fallbackStation = this.getFallbackStation(lat, lon);
        return await this.getAirQuality(fallbackStation);
      } catch {
        return await this.getAirQuality(FALLBACK_STATIONS.seoul);
      }
    }
  }

  private mapCaiGrade(grade: string): string {
    const gradeKey = grade as CaiGradeKey;
    return CAI_GRADE_MAP[gradeKey] || "알수없음";
  }

  private getFallbackStation(lat: number, lon: number): string {
    if (lat >= 37.4 && lat <= 37.7 && lon >= 126.7 && lon <= 127.2) {
      return FALLBACK_STATIONS.seoul;
    }
    if (lat >= 35.0 && lat <= 35.3 && lon >= 128.9 && lon <= 129.3) {
      return FALLBACK_STATIONS.busan;
    }
    return FALLBACK_STATIONS.seoul;
  }
}
