/**
 * VWorld 역지오코딩 프로바이더 테스트
 * API 모킹, 응답 파싱, 에러 처리 검증
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { VWorldGeocodingProvider } from "./VWorldGeocodingProvider";

// Mock fetch and IndexedDB
global.fetch = vi.fn();

// Mock IndexedDB functions
vi.mock("../../lib/storage/db", () => ({
  initDB: vi.fn(),
}));

import { initDB } from "../../lib/storage/db";

describe("VWorldGeocodingProvider", () => {
  let provider: VWorldGeocodingProvider;
  const mockApiKey = "test-vworld-key";
  let mockDB: any;

  beforeEach(() => {
    provider = new VWorldGeocodingProvider(mockApiKey);
    vi.clearAllMocks();

    // 기본 DB mock 설정
    mockDB = {
      get: vi.fn().mockResolvedValue(null), // 기본적으로 캐시 없음
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      transaction: vi.fn(() => ({
        store: {
          index: vi.fn(() => ({
            iterate: vi.fn(() => []),
          })),
          delete: vi.fn().mockResolvedValue(undefined),
        },
        done: Promise.resolve(),
      })),
    };

    (initDB as any).mockResolvedValue(mockDB);
  });

  const testCoords = {
    lat: 37.5665,
    lon: 126.978,
  };

  describe("reverseGeocode", () => {
    it("도로명 주소를 우선적으로 반환해야 함", async () => {
      const mockResponse = {
        response: {
          status: "OK",
          result: [
            {
              address: {
                road: "서울특별시 종로구 청와대로 1",
                parcel: "서울특별시 종로구 종로1가",
              },
              structure: {
                text: "서울특별시 종로구 종로1가",
              },
            },
          ],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await provider.reverseGeocode(testCoords.lat, testCoords.lon);

      expect(result).toBe("서울특별시 종로구 청와대로 1");
      const expectedBaseUrl = import.meta.env.DEV
        ? "/api/vworld/req/address"
        : "https://api.vworld.kr/req/address";
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining(expectedBaseUrl));
      const calledUrl = (global.fetch as any).mock.calls[0][0];
      expect(calledUrl).toContain("point=126.978%2C37.5665");
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("key=test-vworld-key"));
    });

    it("도로명 주소가 없을 때 지번 주소를 반환해야 함", async () => {
      const mockResponse = {
        response: {
          status: "OK",
          result: [
            {
              address: {
                parcel: "서울특별시 종로구 종로1가",
              },
              structure: {
                text: "서울특별시 종로구 종로1가",
              },
            },
          ],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await provider.reverseGeocode(testCoords.lat, testCoords.lon);

      expect(result).toBe("서울특별시 종로구 종로1가");
    });

    it("지번 주소도 없을 때 법정동 정보를 반환해야 함", async () => {
      const mockResponse = {
        response: {
          status: "OK",
          result: [
            {
              structure: {
                level0: "대한민국",
                level1: "서울특별시",
                level2: "종로구",
                level3: "종로1가",
                text: "서울특별시 종로구 종로1가",
              },
            },
          ],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await provider.reverseGeocode(testCoords.lat, testCoords.lon);

      expect(result).toBe("서울특별시 종로구 종로1가");
    });

    it("구조적 정보로 주소를 조합해야 함", async () => {
      const mockResponse = {
        response: {
          status: "OK",
          result: [
            {
              structure: {
                level1: "서울특별시",
                level2: "종로구",
                level3: "종로1가",
                level4: "",
              },
            },
          ],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await provider.reverseGeocode(testCoords.lat, testCoords.lon);

      expect(result).toBe("서울특별시 종로구 종로1가");
    });

    it("API 상태 에러를 처리해야 함", async () => {
      const mockResponse = {
        response: {
          status: "ERROR",
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await provider.reverseGeocode(testCoords.lat, testCoords.lon);

      // 실패 시 폴백 라벨 반환
      expect(result).toBe("37.5665, 126.9780");
    });

    it("빈 결과 응답을 처리해야 함", async () => {
      const mockResponse = {
        response: {
          status: "OK",
          result: [],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await provider.reverseGeocode(testCoords.lat, testCoords.lon);

      expect(result).toBe("37.5665, 126.9780");
    });

    it("네트워크 에러를 처리해야 함", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const result = await provider.reverseGeocode(testCoords.lat, testCoords.lon);

      expect(result).toBe("37.5665, 126.9780");
    });

    it("HTTP 에러 응답을 처리해야 함", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      const result = await provider.reverseGeocode(testCoords.lat, testCoords.lon);

      expect(result).toBe("37.5665, 126.9780");
    });

    it("잘못된 JSON 응답을 처리해야 함", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      const result = await provider.reverseGeocode(testCoords.lat, testCoords.lon);

      expect(result).toBe("37.5665, 126.9780");
    });

    it("주소 파싱이 불가능할 때 폴백 라벨을 생성해야 함", async () => {
      const mockResponse = {
        response: {
          status: "OK",
          result: [
            {
              // address와 structure 모두 비어있음
            },
          ],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await provider.reverseGeocode(testCoords.lat, testCoords.lon);

      expect(result).toBe("37.5665, 126.9780");
    });
  });

  describe("캐시 동작", () => {
    beforeEach(() => {
      // 각 테스트에서 개별적으로 mock 설정
    });

    it("캐시된 결과를 반환해야 함", async () => {
      const cachedAddress = "서울특별시 종로구 청와대로 1";
      const mockCachedData = {
        key: "37.566500,126.978000",
        lat: 37.5665,
        lon: 126.978,
        address: cachedAddress,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 미래 만료
      };

      mockDB.get.mockResolvedValue(mockCachedData);

      const result = await provider.reverseGeocode(testCoords.lat, testCoords.lon);

      expect(result).toBe(cachedAddress);
      expect(mockDB.get).toHaveBeenCalledWith("weather_geocoding_cache", "37.566500,126.978000");
      expect(global.fetch).not.toHaveBeenCalled(); // API 호출되지 않아야 함
    });

    it("만료된 캐시는 무시하고 API를 호출해야 함", async () => {
      const expiredCachedData = {
        key: "37.566500,126.978000",
        lat: 37.5665,
        lon: 126.978,
        address: "만료된 주소",
        createdAt: Date.now() - 31 * 24 * 60 * 60 * 1000, // 31일 전 생성
        expiresAt: Date.now() - 24 * 60 * 60 * 1000, // 1일 전 만료
      };

      mockDB.get.mockResolvedValue(expiredCachedData);

      const mockApiResponse = {
        response: {
          status: "OK",
          result: [
            {
              address: {
                road: "새로운 주소",
              },
            },
          ],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await provider.reverseGeocode(testCoords.lat, testCoords.lon);

      expect(result).toBe("새로운 주소");
      expect(mockDB.delete).toHaveBeenCalledWith("weather_geocoding_cache", "37.566500,126.978000");
      expect(global.fetch).toHaveBeenCalled(); // API 호출되어야 함
    });

    it("캐시가 없을 때 API를 호출하고 결과를 캐시에 저장해야 함", async () => {
      mockDB.get.mockResolvedValue(null); // 캐시 없음

      const mockApiResponse = {
        response: {
          status: "OK",
          result: [
            {
              address: {
                road: "캐시될 주소",
              },
            },
          ],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await provider.reverseGeocode(testCoords.lat, testCoords.lon);

      expect(result).toBe("캐시될 주소");
      expect(mockDB.put).toHaveBeenCalledWith(
        "weather_geocoding_cache",
        expect.objectContaining({
          key: "37.566500,126.978000",
          lat: 37.5665,
          lon: 126.978,
          address: "캐시될 주소",
          createdAt: expect.any(Number),
          expiresAt: expect.any(Number),
        })
      );
    });

    it("캐시 저장 실패 시에도 API 결과를 반환해야 함", async () => {
      mockDB.get.mockResolvedValue(null); // 캐시 없음
      mockDB.put.mockRejectedValue(new Error("DB error")); // 캐시 저장 실패

      const mockApiResponse = {
        response: {
          status: "OK",
          result: [
            {
              address: {
                road: "API 결과 주소",
              },
            },
          ],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await provider.reverseGeocode(testCoords.lat, testCoords.lon);

      expect(result).toBe("API 결과 주소");
      // 캐시 저장은 실패했지만 API 결과는 반환되어야 함
    });

    it("만료된 캐시를 정리해야 함", async () => {
      const expiredEntries = [
        { key: "expired1", value: { key: "expired1" } },
        { key: "expired2", value: { key: "expired2" } },
      ];

      const mockIndex = {
        iterate: vi.fn(() => expiredEntries),
      };

      const mockTransaction = {
        store: {
          index: vi.fn(() => mockIndex),
          delete: vi.fn().mockResolvedValue(undefined),
        },
        done: Promise.resolve(),
      };

      mockDB.transaction.mockReturnValue(mockTransaction);

      // IDBKeyRange mock 설정
      (global as any).IDBKeyRange = {
        upperBound: vi.fn(() => ({
          lower: 0,
          upper: Date.now(),
          lowerOpen: false,
          upperOpen: false,
          includes: vi.fn(),
        })), // mock range object
      };

      await provider.cleanupExpiredCache();

      expect(mockDB.transaction).toHaveBeenCalledWith("weather_geocoding_cache", "readwrite");
      expect(mockIndex.iterate).toHaveBeenCalled();
      expect(mockTransaction.store.delete).toHaveBeenCalledTimes(2);
    });
  });

  describe("API 요청 구조", () => {
    it("올바른 API URL을 구성해야 함", async () => {
      const mockResponse = {
        response: {
          status: "OK",
          result: [
            {
              address: {
                road: "테스트 주소",
              },
            },
          ],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await provider.reverseGeocode(testCoords.lat, testCoords.lon);

      const calledUrl = (global.fetch as any).mock.calls[0][0];
      const expectedBaseUrl = import.meta.env.DEV
        ? "/api/vworld/req/address"
        : "https://api.vworld.kr/req/address";
      expect(calledUrl).toContain(expectedBaseUrl);
      expect(calledUrl).toContain("service=address");
      expect(calledUrl).toContain("request=GetAddress");
      expect(calledUrl).toContain("version=2.0");
      expect(calledUrl).toContain("crs=EPSG%3A4326"); // URL 인코딩됨
      expect(calledUrl).toContain("format=json");
      expect(calledUrl).toContain("type=both");
      expect(calledUrl).toContain("key=test-vworld-key");
    });

    it("좌표를 올바른 형식으로 전송해야 함", async () => {
      const mockResponse = {
        response: {
          status: "OK",
          result: [
            {
              address: {
                road: "테스트 주소",
              },
            },
          ],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await provider.reverseGeocode(37.1234, 127.5678);

      const calledUrl = (global.fetch as any).mock.calls[0][0];
      expect(calledUrl).toContain("point=127.5678%2C37.1234"); // URL 인코딩됨
    });
  });

  describe("폴백 라벨 생성", () => {
    it("좌표를 기반으로 폴백 라벨을 생성해야 함", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const result = await provider.reverseGeocode(37.123456, 127.987654);

      expect(result).toBe("37.1235, 127.9877");
    });
  });
});
