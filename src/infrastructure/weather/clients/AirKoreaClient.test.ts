/**
 * AirKoreaProvider 단위 테스트
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { AirKoreaProvider } from "./AirKoreaClient";

// Mock fetch
global.fetch = vi.fn();

describe("AirKoreaProvider", () => {
  let provider: AirKoreaProvider;
  const mockApiKey = "test-api-key";

  beforeEach(() => {
    provider = new AirKoreaProvider(mockApiKey);
    vi.clearAllMocks();
  });

  describe("getNearbyStations", () => {
    it("근처 측정소를 가져와 반환해야 함", async () => {
      const mockResponse = {
        response: {
          header: { resultCode: "00", resultMsg: "success" },
          body: {
            items: [
              {
                stationName: "종로구",
                addr: "서울 종로구 종로 1",
                tm: 100,
                dmX: "126.9784",
                dmY: "37.5665",
              },
            ],
          },
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      const result = await provider.getNearbyStations(200000, 500000);

      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("getNearbyMsrstnList"));
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: "종로구",
        address: "서울 종로구 종로 1",
        distance: 100,
        lat: 37.5665,
        lon: 126.9784,
      });
    });

    it("API 실패 시 에러를 발생시켜야 함", async () => {
      const mockResponse = {
        response: {
          header: { resultCode: "99", resultMsg: "API error" },
          body: { items: [] },
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      await expect(provider.getNearbyStations(200000, 500000)).rejects.toThrow(
        "AirKorea API Error: API error"
      );
    });

    it("측정소가 없을 때 에러를 발생시켜야 함", async () => {
      const mockResponse = {
        response: {
          header: { resultCode: "00", resultMsg: "success" },
          body: { items: [] },
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      await expect(provider.getNearbyStations(200000, 500000)).rejects.toThrow(
        "No nearby stations found"
      );
    });
  });

  describe("getAirQuality", () => {
    it("대기질 데이터를 가져와 반환해야 함", async () => {
      const mockResponse = {
        response: {
          header: { resultCode: "00", resultMsg: "success" },
          body: {
            items: [
              {
                dataTime: "2024-01-01 10:00",
                stationName: "종로구",
                pm10Value: "25",
                pm25Value: "15",
                khaiValue: "45",
                khaiGrade: "2",
              },
            ],
          },
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      const result = await provider.getAirQuality("종로구");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("getMsrstnAcctoRltmMesureDnsty")
      );
      expect(result).toEqual({
        pm10: 25,
        pm25: 15,
        aqiKorea: "보통",
        stationName: "종로구",
        updatedAt: expect.any(Number),
      });
    });

    it("null 값을 올바르게 처리해야 함", async () => {
      const mockResponse = {
        response: {
          header: { resultCode: "00", resultMsg: "success" },
          body: {
            items: [
              {
                dataTime: "2024-01-01 10:00",
                stationName: "종로구",
                pm10Value: "",
                pm25Value: "-",
                khaiValue: "0",
                khaiGrade: "1",
              },
            ],
          },
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      const result = await provider.getAirQuality("종로구");

      expect(result.pm10).toBeNull();
      expect(result.pm25).toBeNull();
      expect(result.aqiKorea).toBe("좋음");
    });
  });

  describe("CAI grade mapping", () => {
    it("CAI 등급을 올바르게 매핑해야 함", async () => {
      const testCases = [
        { input: "1", expected: "좋음" },
        { input: "2", expected: "보통" },
        { input: "3", expected: "나쁨" },
        { input: "4", expected: "매우나쁨" },
        { input: "0", expected: "알수없음" },
      ];

      for (const { input, expected } of testCases) {
        const mockResponse = {
          response: {
            header: { resultCode: "00", resultMsg: "success" },
            body: {
              items: [
                {
                  dataTime: "2024-01-01 10:00",
                  stationName: "테스트",
                  pm10Value: "10",
                  pm25Value: "5",
                  khaiValue: "10",
                  khaiGrade: input,
                },
              ],
            },
          },
        };

        (global.fetch as any).mockResolvedValueOnce({
          json: () => Promise.resolve(mockResponse),
        });

        const result = await provider.getAirQuality("테스트");
        expect(result.aqiKorea).toBe(expected);
      }
    });
  });
});
