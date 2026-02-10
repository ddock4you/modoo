/**
 * VWorld 역지오코딩 프로바이더
 * 좌표 → 주소 라벨 변환
 */

import { initDB } from "@/lib/storage/db";
import { idbUpperBound } from "@/lib/weather/utils/idb";

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
    try {
      const cached = await this.getCachedResult(lat, lon);
      if (cached) return cached;

      const response = await this.callVWorldApi(lat, lon);
      const address = this.parseAddressResponse(response);
      await this.setCachedResult(lat, lon, address);
      return address;
    } catch (error) {
      console.warn("VWorld geocoding failed:", error);
      return this.createFallbackLabel(lat, lon);
    }
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
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`VWorld API error: ${response.status} ${response.statusText}`);
    }

    const data: VWorldApiResponse = await response.json();
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

  private createFallbackLabel(lat: number, lon: number): string {
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }

  private async getCachedResult(lat: number, lon: number): Promise<string | null> {
    try {
      const db = await initDB();
      const cacheKey = `${lat.toFixed(6)},${lon.toFixed(6)}`;

      const cached = await db.get("weather_geocoding_cache", cacheKey);
      if (!cached) return null;

      if (Date.now() > cached.expiresAt) {
        await db.delete("weather_geocoding_cache", cacheKey);
        return null;
      }

      return cached.address;
    } catch (error) {
      console.warn("Failed to get cached geocoding result:", error);
      return null;
    }
  }

  private async setCachedResult(lat: number, lon: number, address: string): Promise<void> {
    try {
      const db = await initDB();
      const cacheKey = `${lat.toFixed(6)},${lon.toFixed(6)}`;
      const now = Date.now();
      const expiresAt = now + 30 * 24 * 60 * 60 * 1000;

      await db.put("weather_geocoding_cache", {
        key: cacheKey,
        lat,
        lon,
        address,
        createdAt: now,
        expiresAt,
      });
    } catch (error) {
      console.warn("Failed to cache geocoding result:", error);
    }
  }

  async cleanupExpiredCache(): Promise<void> {
    try {
      const db = await initDB();
      const now = Date.now();

      const tx = db.transaction("weather_geocoding_cache", "readwrite");
      const index = tx.store.index("byExpiresAt");
      const range = idbUpperBound(now);

      if (!range) {
        await tx.done;
        return;
      }

      const expiredKeys: string[] = [];
      for await (const cursor of index.iterate(range)) {
        expiredKeys.push(cursor.value.key);
      }

      await Promise.all(expiredKeys.map((key) => tx.store.delete(key)));
      await tx.done;

      if (expiredKeys.length > 0 && import.meta.env.DEV) {
        console.log(`Cleaned up ${expiredKeys.length} expired geocoding cache entries`);
      }
    } catch (error) {
      console.warn("Failed to cleanup expired geocoding cache:", error);
    }
  }
}
