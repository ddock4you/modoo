/**
 * AirKoreaProvider 단위 테스트
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { AirKoreaProvider } from "./AirKoreaProvider";

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
    it("should fetch and return nearby stations", async () => {
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

    it("should throw error on API failure", async () => {
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

    it("should throw error when no stations found", async () => {
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
    it("should fetch and return air quality data", async () => {
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

    it("should handle null values correctly", async () => {
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

  describe("getAirQualityByLocation", () => {
    it("should get air quality by coordinates", async () => {
      // Mock coord import
      vi.doMock("./coord", () => ({
        latLonToTM: vi.fn(() => ({ tmX: 200000, tmY: 500000 })),
      }));

      // Mock getNearbyStations
      const mockStations = [
        { name: "종로구", address: "서울 종로구", distance: 100, lat: 37.5665, lon: 126.9784 },
      ];
      vi.spyOn(provider, "getNearbyStations").mockResolvedValue(mockStations);

      // Mock getAirQuality
      const mockAirQuality = {
        pm10: 25,
        pm25: 15,
        aqiKorea: "보통",
        stationName: "종로구",
        updatedAt: Date.now(),
      };
      vi.spyOn(provider, "getAirQuality").mockResolvedValue(mockAirQuality);

      const result = await provider.getAirQualityByLocation(37.5665, 126.9784);

      expect(provider.getNearbyStations).toHaveBeenCalledWith(200000, 500000);
      expect(provider.getAirQuality).toHaveBeenCalledWith("종로구");
      expect(result).toEqual(mockAirQuality);
    });

    it("should fallback to default station on failure", async () => {
      vi.spyOn(provider, "getNearbyStations").mockRejectedValue(new Error("API error"));
      vi.spyOn(provider, "getAirQuality").mockResolvedValue({
        pm10: 20,
        pm25: 10,
        aqiKorea: "좋음",
        stationName: "종로구",
        updatedAt: Date.now(),
      });

      const result = await provider.getAirQualityByLocation(37.5665, 126.9784);

      expect(provider.getAirQuality).toHaveBeenCalledWith("종로구");
      expect(result.aqiKorea).toBe("좋음");
    });
  });

  describe("CAI grade mapping", () => {
    it("should map CAI grades correctly", async () => {
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
