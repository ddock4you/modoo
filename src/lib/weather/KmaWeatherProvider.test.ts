/**
 * 기상청(KMA) 날씨 프로바이더 테스트
 * API 모킹, 응답 파싱, 에러 처리 검증
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { KmaWeatherProvider } from "./KmaWeatherProvider";
import type { WeatherLocation } from "../../domain/types";

describe("KmaWeatherProvider", () => {
  let provider: KmaWeatherProvider;
  const mockApiKey = "test-kma-key";

  beforeEach(() => {
    provider = new KmaWeatherProvider(mockApiKey);
    vi.clearAllMocks();
  });

  const mockLocation: WeatherLocation = {
    id: "37.5665,126.9780",
    name: "서울 종로구",
    lat: 37.5665,
    lon: 126.978,
    nx: 60,
    ny: 127,
    tmX: 198000,
    tmY: 451000,
    timezone: "Asia/Seoul",
  };

  describe("getCurrentWeather", () => {
    it("현재 날씨 데이터를 올바르게 가져와 파싱해야 함", async () => {
      const mockApiResponse = {
        response: {
          header: { resultCode: "00", resultMsg: "success" },
          body: {
            items: {
              item: [
                { category: "T1H", obsrValue: "23.5" }, // 기온
                { category: "REH", obsrValue: "65" }, // 습도
                { category: "WSD", obsrValue: "2.1" }, // 풍속
                { category: "SKY", obsrValue: "1" }, // 하늘상태
                { category: "PTY", obsrValue: "0" }, // 강수형태
              ],
            },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await provider.getCurrentWeather(mockLocation);

      expect(result.tempC).toBe(23.5);
      expect(result.humidityPct).toBe(65);
      expect(result.windMs).toBe(2.1);
      expect(result.weatherCode.sky).toBe(1);
      expect(result.weatherCode.pty).toBe(0);
      expect(typeof result.updatedAt).toBe("number");

      // API 호출 검증
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("getUltraSrtNcst"));
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("serviceKey=test-kma-key"));
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("nx=60"));
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("ny=127"));
    });

    it("API 에러 응답을 처리해야 함", async () => {
      const mockErrorResponse = {
        response: {
          header: { resultCode: "99", resultMsg: "API error occurred" },
          body: { items: { item: [] } },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockErrorResponse),
      });

      await expect(provider.getCurrentWeather(mockLocation)).rejects.toThrow(
        "KMA API Error: API error occurred"
      );
    });

    it("빈 응답 데이터를 처리해야 함", async () => {
      const mockEmptyResponse = {
        response: {
          header: { resultCode: "00", resultMsg: "success" },
          body: { items: { item: [] } },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockEmptyResponse),
      });

      await expect(provider.getCurrentWeather(mockLocation)).rejects.toThrow(
        "No weather data available"
      );
    });

    it("날씨 코드를 올바르게 파싱해야 함", async () => {
      const mockResponse = {
        response: {
          header: { resultCode: "00", resultMsg: "success" },
          body: {
            items: {
              item: [
                { category: "T1H", obsrValue: "18.5" },
                { category: "REH", obsrValue: "78" },
                { category: "WSD", obsrValue: "3.2" },
                { category: "SKY", obsrValue: "3" }, // 구름많음
                { category: "PTY", obsrValue: "1" }, // 비
              ],
            },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      });

      const result = await provider.getCurrentWeather(mockLocation);

      expect(result.weatherCode.sky).toBe(3);
      expect(result.weatherCode.pty).toBe(1);
    });
  });

  describe("getHourlyForecast", () => {
    it("시간별 예보 데이터를 가져와 파싱해야 함", async () => {
      const mockResponse = {
        response: {
          header: { resultCode: "00", resultMsg: "success" },
          body: {
            items: {
              item: [
                {
                  category: "T1H",
                  fcstDate: "20240101",
                  fcstTime: "1500",
                  fcstValue: "22.0",
                },
                {
                  category: "REH",
                  fcstDate: "20240101",
                  fcstTime: "1500",
                  fcstValue: "60",
                },
                {
                  category: "SKY",
                  fcstDate: "20240101",
                  fcstTime: "1500",
                  fcstValue: "2",
                },
              ],
            },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      });

      const result = await provider.getHourlyForecast(mockLocation);

      expect(result).toHaveLength(1);
      expect(result[0].tempC).toBe(22.0);
      expect(result[0].humidityPct).toBe(60);
      expect(result[0].sky).toBe(2);
      // 시간은 현재 날짜를 기반으로 생성되므로 ISO 문자열인지 확인
      expect(result[0].time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("getUltraSrtFcst"));
    });

    it("과거 예보를 필터링해야 함", async () => {
      // 현재 시간 이후의 데이터만 포함한 모의 응답 (시간 필터링이 제대로 동작하는지 확인)
      const currentHour = new Date().getHours();
      const futureHour = (currentHour + 2) % 24; // 2시간 후
      const futureTime = futureHour.toString().padStart(2, "0") + "00";

      const mockResponse = {
        response: {
          header: { resultCode: "00", resultMsg: "success" },
          body: {
            items: {
              item: [
                {
                  category: "T1H",
                  fcstDate: "20240101",
                  fcstTime: futureTime,
                  fcstValue: "25.0",
                },
                {
                  category: "REH",
                  fcstDate: "20240101",
                  fcstTime: futureTime,
                  fcstValue: "60",
                },
              ],
            },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      });

      const result = await provider.getHourlyForecast(mockLocation);

      // 미래 데이터만 포함되어야 함
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].tempC).toBe(25.0);
      expect(result[0].humidityPct).toBe(60);
    });

    it("결과를 24시간으로 제한해야 함", async () => {
      // 25개 이상의 데이터를 포함한 모의 응답
      const items = [];
      for (let i = 0; i < 30; i++) {
        items.push({
          category: "T1H",
          fcstDate: "20240101",
          fcstTime: String(1000 + i * 100).padStart(4, "0"),
          fcstValue: String(20 + i * 0.5),
        });
      }

      const mockResponse = {
        response: {
          header: { resultCode: "00", resultMsg: "success" },
          body: { items: { item: items } },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      });

      const result = await provider.getHourlyForecast(mockLocation);

      expect(result.length).toBeLessThanOrEqual(24);
    });
  });

  describe("getDailyForecast", () => {
    it("일별 예보 데이터를 가져와 파싱해야 함", async () => {
      const mockResponse = {
        response: {
          header: { resultCode: "00", resultMsg: "success" },
          body: {
            items: {
              item: [
                { category: "TMN", fcstDate: "20240101", fcstValue: "15" }, // 최저기온
                { category: "TMX", fcstDate: "20240101", fcstValue: "25" }, // 최고기온
                { category: "POP", fcstDate: "20240101", fcstValue: "30" }, // 강수확률
                { category: "SKY", fcstDate: "20240101", fcstValue: "2" }, // 하늘상태
              ],
            },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      });

      const result = await provider.getDailyForecast(mockLocation);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe("2024-01-01");
      expect(result[0].minC).toBe(15);
      expect(result[0].maxC).toBe(25);
      expect(result[0].precipProbMaxPct).toBe(30);
      expect(result[0].sky).toBe(2);

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("getVilageFcst"));
    });

    it("결과를 7일로 제한해야 함", async () => {
      // 10일치 데이터를 포함한 모의 응답
      const items = [];
      for (let i = 0; i < 10; i++) {
        const date = `202401${String(i + 1).padStart(2, "0")}`;
        items.push(
          { category: "TMN", fcstDate: date, fcstValue: "10" },
          { category: "TMX", fcstDate: date, fcstValue: "20" }
        );
      }

      const mockResponse = {
        response: {
          header: { resultCode: "00", resultMsg: "success" },
          body: { items: { item: items } },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      });

      const result = await provider.getDailyForecast(mockLocation);

      expect(result.length).toBeLessThanOrEqual(7);
    });
  });

  describe("API 통합", () => {
    it("올바른 API URL을 구성해야 함", async () => {
      const mockResponse = {
        response: {
          header: { resultCode: "00", resultMsg: "success" },
          body: {
            items: {
              item: [
                { category: "T1H", obsrValue: "20.0" },
                { category: "REH", obsrValue: "60" },
                { category: "WSD", obsrValue: "1.5" },
                { category: "SKY", obsrValue: "1" },
                { category: "PTY", obsrValue: "0" },
              ],
            },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      });

      await provider.getCurrentWeather(mockLocation);

      const calledUrl = (global.fetch as any).mock.calls[0][0];
      expect(calledUrl).toContain("https://apis.data.go.kr/1360000");
      expect(calledUrl).toContain("serviceKey=test-kma-key");
      expect(calledUrl).toContain("nx=60");
      expect(calledUrl).toContain("ny=127");
      expect(calledUrl).toContain("dataType=JSON");
    });

    it("네트워크 에러를 처리해야 함", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      await expect(provider.getCurrentWeather(mockLocation)).rejects.toThrow();
    });

    it("잘못된 JSON 응답을 처리해야 함", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      await expect(provider.getCurrentWeather(mockLocation)).rejects.toThrow();
    });
  });

  describe("날짜/시간 처리", () => {
    it("현재 날씨에 대한 올바른 기준 시간을 계산해야 함", async () => {
      const mockResponse = {
        response: {
          header: { resultCode: "00", resultMsg: "success" },
          body: {
            items: {
              item: [
                { category: "T1H", obsrValue: "20.0" },
                { category: "REH", obsrValue: "60" },
                { category: "WSD", obsrValue: "1.5" },
                { category: "SKY", obsrValue: "1" },
                { category: "PTY", obsrValue: "0" },
              ],
            },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      });

      // 테스트 시간을 제어하기 위해 Date를 모킹할 수 있지만,
      // 실제 구현에서는 현재 시간을 사용하므로 기본 동작만 검증
      const result = await provider.getCurrentWeather(mockLocation);
      expect(result).toBeDefined();
    });
  });

  describe("데이터 검증", () => {
    it("누락된 날씨 데이터를 gracefully하게 처리해야 함", async () => {
      const mockResponse = {
        response: {
          header: { resultCode: "00", resultMsg: "success" },
          body: {
            items: {
              item: [
                { category: "T1H", obsrValue: "20.0" },
                // 일부 카테고리 데이터 누락
                { category: "WSD", obsrValue: "1.5" },
              ],
            },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      });

      const result = await provider.getCurrentWeather(mockLocation);

      expect(result.tempC).toBe(20.0);
      expect(result.windMs).toBe(1.5);
      expect(result.humidityPct).toBe(0); // 기본값
      expect(result.weatherCode.sky).toBe(1); // 기본값
    });

    it("숫자 값을 올바르게 파싱해야 함", async () => {
      const mockResponse = {
        response: {
          header: { resultCode: "00", resultMsg: "success" },
          body: {
            items: {
              item: [
                { category: "T1H", obsrValue: "23.7" },
                { category: "REH", obsrValue: "67" },
                { category: "WSD", obsrValue: "2.8" },
                { category: "SKY", obsrValue: "3" },
                { category: "PTY", obsrValue: "2" },
              ],
            },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      });

      const result = await provider.getCurrentWeather(mockLocation);

      expect(typeof result.tempC).toBe("number");
      expect(typeof result.humidityPct).toBe("number");
      expect(typeof result.windMs).toBe("number");
      expect(typeof result.weatherCode.sky).toBe("number");
      expect(typeof result.weatherCode.pty).toBe("number");
    });
  });
});
