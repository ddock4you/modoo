/**
 * AirKorea 대기질 데이터 프로바이더
 * getNearbyMsrstnList + getMsrstnAcctoRltmMesureDnsty API 연동
 */

import type { AirQuality } from "@/domain/types";
import { fetchJson } from "@/lib/api/http";

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

export interface AirKoreaStation {
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

export class AirKoreaProvider {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.baseUrl = "https://apis.data.go.kr/B552584";
    this.apiKey = apiKey;
  }

  async getNearbyStations(tmX: number, tmY: number): Promise<AirKoreaStation[]> {
    const params = new URLSearchParams({
      serviceKey: this.apiKey,
      returnType: "json",
      tmX: tmX.toString(),
      tmY: tmY.toString(),
      ver: "1.0",
    });

    const url = `${this.baseUrl}/MsrstnInfoInqireSvc/getNearbyMsrstnList?${params}`;

    const data = await fetchJson<AirKoreaApiResponse<NearbyStationItem>>(url);

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

    const data = await fetchJson<AirKoreaApiResponse<MeasurementItem>>(url);

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

  private mapCaiGrade(grade: string): string {
    const gradeKey = grade as CaiGradeKey;
    return CAI_GRADE_MAP[gradeKey] || "알수없음";
  }
}
