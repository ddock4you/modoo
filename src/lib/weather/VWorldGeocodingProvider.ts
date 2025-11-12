/**
 * VWorld 역지오코딩 프로바이더
 * 좌표 → 주소 라벨 변환
 *
 * VWorld API를 사용하여 위경도 좌표를 사람이 읽을 수 있는 주소로 변환
 * 우선순위: 도로명 주소 → 지번 주소 → 법정동 정보
 */

import { initDB } from "../../lib/storage/db";

// VWorld API 응답 타입 정의
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
        parcel?: string; // 지번 주소
        road?: string; // 도로명 주소
      };
    }>;
  };
}

export class VWorldGeocodingProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // 개발 환경에서는 프록시 사용, 프로덕션에서는 직접 API 호출
    this.baseUrl = import.meta.env.DEV
      ? "/api/vworld/req/address"
      : "https://api.vworld.kr/req/address";
  }

  /**
   * 좌표를 주소로 변환 (역지오코딩)
   * @param lat 위도
   * @param lon 경도
   * @returns 주소 라벨 문자열
   */
  async reverseGeocode(lat: number, lon: number): Promise<string> {
    try {
      // 캐시 확인
      const cached = await this.getCachedResult(lat, lon);
      if (cached) return cached;

      // API 호출
      const response = await this.callVWorldApi(lat, lon);
      const address = this.parseAddressResponse(response);
      // 캐시에 저장 (30일 TTL)
      await this.setCachedResult(lat, lon, address);

      return address;
    } catch (error) {
      console.warn("VWorld geocoding failed:", error);
      // 실패 시 임시 라벨 반환
      return this.createFallbackLabel(lat, lon);
    }
  }

  /**
   * VWorld API 호출
   */
  private async callVWorldApi(lat: number, lon: number): Promise<VWorldApiResponse> {
    const params = new URLSearchParams({
      service: "address",
      request: "GetAddress",
      version: "2.0",
      crs: "EPSG:4326", // WGS84 좌표계
      point: `${lon},${lat}`, // 경도,위도 순서
      format: "json",
      type: "both", // 도로명과 지번 주소 모두 요청
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

  /**
   * API 응답에서 주소 파싱 (우선순위 적용)
   * 1. 도로명 주소 (road)
   * 2. 지번 주소 (parcel)
   * 3. 법정동 정보 (structure.text)
   */
  private parseAddressResponse(response: VWorldApiResponse): string {
    const result = response.response.result?.[0];
    if (!result) {
      throw new Error("No address result from VWorld API");
    }

    // 1. 도로명 주소 우선
    if (result.address?.road) {
      return result.address.road;
    }

    // 2. 지번 주소
    if (result.address?.parcel) {
      return result.address.parcel;
    }

    // 3. 법정동 정보
    if (result.structure?.text) {
      return result.structure.text;
    }

    // 4. 구조적 정보로 주소 조합
    const structure = result.structure;
    if (structure) {
      const parts = [
        structure.level1, // 시/도
        structure.level2, // 시/군/구
        structure.level3, // 동/읍/면
        structure.level4, // 세부 지역
      ].filter(Boolean);

      if (parts.length > 0) {
        return parts.join(" ");
      }
    }

    throw new Error("Unable to parse address from VWorld response");
  }

  /**
   * API 실패 시 임시 라벨 생성
   */
  private createFallbackLabel(lat: number, lon: number): string {
    // 소수점 4자리까지 표시
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }

  /**
   * 캐시에서 결과 조회 (30일 TTL)
   */
  private async getCachedResult(lat: number, lon: number): Promise<string | null> {
    try {
      const db = await initDB();
      const cacheKey = `${lat.toFixed(6)},${lon.toFixed(6)}`; // 정밀도 6자리로 키 생성

      const cached = await db.get("weather_geocoding_cache", cacheKey);
      if (!cached) return null;

      // TTL 확인
      const now = Date.now();
      if (now > cached.expiresAt) {
        // 만료된 캐시는 삭제
        await db.delete("weather_geocoding_cache", cacheKey);
        return null;
      }

      return cached.address;
    } catch (error) {
      console.warn("Failed to get cached geocoding result:", error);
      return null;
    }
  }

  /**
   * 결과를 캐시에 저장 (30일 TTL)
   */
  private async setCachedResult(lat: number, lon: number, address: string): Promise<void> {
    try {
      const db = await initDB();
      const cacheKey = `${lat.toFixed(6)},${lon.toFixed(6)}`; // 정밀도 6자리로 키 생성
      const now = Date.now();
      const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30일 후 만료

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
      // 캐시 실패는 치명적이지 않으므로 에러를 던지지 않음
    }
  }

  /**
   * 만료된 캐시 정리 (주기적으로 호출)
   */
  async cleanupExpiredCache(): Promise<void> {
    try {
      const db = await initDB();
      const now = Date.now();

      // 만료된 캐시 조회 및 삭제
      const expiredKeys: string[] = [];
      const index = db.transaction("weather_geocoding_cache").store.index("byExpiresAt");

      for await (const cursor of index.iterate(null, IDBKeyRange.upperBound(now))) {
        expiredKeys.push(cursor.value.key);
      }

      if (expiredKeys.length > 0) {
        const tx = db.transaction("weather_geocoding_cache", "readwrite");
        await Promise.all(expiredKeys.map((key) => tx.store.delete(key)));
        await tx.done;
        if (import.meta.env.DEV) {
          console.log(`Cleaned up ${expiredKeys.length} expired geocoding cache entries`);
        }
      }
    } catch (error) {
      console.warn("Failed to cleanup expired geocoding cache:", error);
    }
  }
}
