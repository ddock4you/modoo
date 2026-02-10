/**
 * VWorld 역지오코딩 프로바이더
 * 좌표 → 주소 라벨 변환
 */

import { fetchJson } from "@/lib/weather/utils/http";

interface VWorldApiResponse {
  response: {
    status: string;
    result?: Array<{
      structure?: {
        level0?: string;
        level1?: string;
        level2?: string;
        level3?: string;
        level4?: string;
        level5?: string;
        text?: string;
      };
      address?: {
        total?: string;
        parcel?: string;
        road?: string;
      };
    }>;
  };
}

export class VWorldGeocodingProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = import.meta.env.DEV ? "/api/vworld/req/address" : "https://api.vworld.kr/req/address";
  }

  async reverseGeocode(lat: number, lon: number): Promise<string> {
    const response = await this.callVWorldApi(lat, lon);
    return this.parseAddressResponse(response);
  }

  private async callVWorldApi(lat: number, lon: number): Promise<VWorldApiResponse> {
    const params = new URLSearchParams({
      service: "address",
      request: "GetAddress",
      version: "2.0",
      crs: "EPSG:4326",
      point: `${lon},${lat}`,
      format: "json",
      type: "both",
      key: this.apiKey,
    });

    const url = `${this.baseUrl}?${params.toString()}`;

    const data = await fetchJson<VWorldApiResponse>(url);
    if (data.response.status !== "OK") {
      throw new Error(`VWorld API status error: ${data.response.status}`);
    }
    return data;
  }

  private parseAddressResponse(response: VWorldApiResponse): string {
    const result = response.response.result?.[0];
    if (!result) throw new Error("No address result from VWorld API");

    if (result.address?.road) return result.address.road;
    if (result.address?.parcel) return result.address.parcel;
    if (result.structure?.text) return result.structure.text;

    const structure = result.structure;
    if (structure) {
      const parts = [structure.level1, structure.level2, structure.level3, structure.level4].filter(Boolean);
      if (parts.length > 0) return parts.join(" ");
    }

    throw new Error("Unable to parse address from VWorld response");
  }
}
