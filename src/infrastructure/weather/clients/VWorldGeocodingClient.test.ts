/**
 * VWorld reverse geocoding provider tests
 * - API request shape
 * - response parsing priority (road -> parcel -> structure)
 * - error propagation (cache is handled by IndexedDbWeatherCache/WeatherRepository)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { VWorldGeocodingProvider } from "./VWorldGeocodingClient";

global.fetch = vi.fn();

describe("VWorldGeocodingProvider", () => {
  let provider: VWorldGeocodingProvider;
  const mockApiKey = "test-vworld-key";

  beforeEach(() => {
    provider = new VWorldGeocodingProvider(mockApiKey);
    vi.clearAllMocks();
  });

  const testCoords = { lat: 37.5665, lon: 126.978 };

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

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await provider.reverseGeocode(testCoords.lat, testCoords.lon);
    expect(result).toBe("서울특별시 종로구 청와대로 1");
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

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await provider.reverseGeocode(testCoords.lat, testCoords.lon);
    expect(result).toBe("서울특별시 종로구 종로1가");
  });

  it("주소가 없을 때 structure.text를 반환해야 함", async () => {
    const mockResponse = {
      response: {
        status: "OK",
        result: [
          {
            structure: {
              text: "서울특별시 종로구 종로1가",
            },
          },
        ],
      },
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await provider.reverseGeocode(testCoords.lat, testCoords.lon);
    expect(result).toBe("서울특별시 종로구 종로1가");
  });

  it("structure.text도 없을 때 level 조합으로 주소를 만들어야 함", async () => {
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

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await provider.reverseGeocode(testCoords.lat, testCoords.lon);
    expect(result).toBe("서울특별시 종로구 종로1가");
  });

  it("API status가 OK가 아니면 에러를 발생시켜야 함", async () => {
    const mockResponse = {
      response: {
        status: "ERROR",
      },
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    await expect(provider.reverseGeocode(testCoords.lat, testCoords.lon)).rejects.toThrow(
      "VWorld API status error"
    );
  });

  it("빈 result면 에러를 발생시켜야 함", async () => {
    const mockResponse = {
      response: {
        status: "OK",
        result: [],
      },
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    await expect(provider.reverseGeocode(testCoords.lat, testCoords.lon)).rejects.toThrow(
      "No address result"
    );
  });

  it("HTTP 에러 응답을 처리해야 함", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(provider.reverseGeocode(testCoords.lat, testCoords.lon)).rejects.toThrow("HTTP 500");
  });

  it("잘못된 JSON 응답을 처리해야 함", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new Error("Invalid JSON")),
    });

    await expect(provider.reverseGeocode(testCoords.lat, testCoords.lon)).rejects.toThrow(
      "Invalid JSON response"
    );
  });

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

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    await provider.reverseGeocode(testCoords.lat, testCoords.lon);

    const calledUrl = (global.fetch as any).mock.calls[0][0] as string;
    const expectedBaseUrl = import.meta.env.DEV
      ? "/api/vworld/req/address"
      : "https://api.vworld.kr/req/address";
    expect(calledUrl).toContain(expectedBaseUrl);
    expect(calledUrl).toContain("service=address");
    expect(calledUrl).toContain("request=GetAddress");
    expect(calledUrl).toContain("version=2.0");
    expect(calledUrl).toContain("crs=EPSG%3A4326");
    expect(calledUrl).toContain("format=json");
    expect(calledUrl).toContain("type=both");
    expect(calledUrl).toContain("key=test-vworld-key");
    expect(calledUrl).toContain("point=126.978%2C37.5665");
  });
});
