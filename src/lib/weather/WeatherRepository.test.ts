import { describe, it, expect, beforeEach, vi, afterEach, beforeAll } from "vitest";
import { WeatherRepository } from "./WeatherRepository";
import { weatherCache } from "./IndexedDbWeatherCache";
import type {
  WeatherNow,
  WeatherHourlyPoint,
  WeatherDailyPoint,
  AirQuality,
  WeatherLocation,
} from "../../domain/types";

// IndexedDB 모킹
import "fake-indexeddb/auto";

// fetch 모킹
const fetchMock = vi.fn();
global.fetch = fetchMock;

// 전역 모킹 설정
declare global {
  interface IDBDatabase {
    _close?: () => void;
  }
}

// 테스트용 모의 데이터
const mockWeatherNow: WeatherNow = {
  tempC: 25,
  humidityPct: 60,
  windMs: 2.5,
  weatherCode: { sky: 1, pty: 0 },
  updatedAt: Date.now(),
};

const mockWeatherHourly: WeatherHourlyPoint[] = [
  {
    time: new Date().toISOString(),
    tempC: 25,
    humidityPct: 60,
    precipProbPct: 0,
    sky: 1,
    pty: 0,
  },
];

const mockWeatherDaily: WeatherDailyPoint[] = [
  {
    date: new Date().toISOString().split("T")[0],
    minC: 22,
    maxC: 28,
    precipProbMaxPct: 0,
    sky: 1,
    pty: 0,
  },
];

const mockAirQuality: AirQuality = {
  pm10: 35,
  pm25: 20,
  aqiKorea: "보통",
  stationName: "종로구",
  updatedAt: Date.now(),
};

const mockLocation: WeatherLocation = {
  id: "grid_60_127",
  lat: 37.5665,
  lon: 126.978,
  name: "서울특별시 중구",
  nx: 60,
  ny: 127,
  tmX: 198368.5,
  tmY: 451130.0,
  timezone: "Asia/Seoul",
};

describe("WeatherRepository", () => {
  let repository: WeatherRepository;

  beforeAll(() => {
    // 환경 변수 모킹
    vi.stubEnv("VITE_KMA_SERVICE_KEY", "test-kma-key");
    vi.stubEnv("VITE_AIRKOREA_SERVICE_KEY", "test-airkorea-key");
    vi.stubEnv("VITE_VWORLD_API_KEY", "test-vworld-key");
  });

  beforeEach(async () => {
    repository = new WeatherRepository({
      kmaApiKey: "test-kma-key",
      airKoreaApiKey: "test-airkorea-key",
      vworldApiKey: "test-vworld-key",
    });

    // fetch 모킹 초기화
    fetchMock.mockClear();

    // IndexedDB 초기화 대기
    await repository.init();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("초기화", () => {
    it("초기화 시 캐시가 정상적으로 초기화되어야 함", async () => {
      expect(repository).toBeDefined();
      // 초기화는 beforeEach에서 이미 수행됨
    });
  });

  describe("locationId 생성", () => {
    it("KMA 격자 기반으로 locationId를 생성해야 함", async () => {
      // 서울 시청 좌표 (약 nx=60, ny=127)
      const locationId = (repository as any).generateLocationId(37.5665, 126.978);
      expect(locationId).toMatch(/^grid_\d+_\d+$/);
    });

    it("동일한 격자의 좌표는 동일한 locationId를 생성해야 함", async () => {
      const id1 = (repository as any).generateLocationId(37.5665, 126.978);
      const id2 = (repository as any).generateLocationId(37.5666, 126.9781);
      expect(id1).toBe(id2);
    });
  });

  describe("baseTime 정규화", () => {
    it("현재 날씨는 10분 단위로 정규화해야 함", async () => {
      const now = new Date("2024-01-01T12:37:00").getTime();
      const normalized = (repository as any).normalizeBaseTime(now, "now");
      const expected = new Date("2024-01-01T12:30:00").getTime();
      expect(normalized).toBe(expected);
    });

    it("시간별 날씨는 시간 단위로 정규화해야 함", async () => {
      const now = new Date("2024-01-01T12:37:00").getTime();
      const normalized = (repository as any).normalizeBaseTime(now, "hourly");
      const expected = new Date("2024-01-01T12:00:00").getTime();
      expect(normalized).toBe(expected);
    });

    it("일별 날씨는 3시간 단위로 정규화해야 함", async () => {
      const now = new Date("2024-01-01T14:37:00").getTime();
      const normalized = (repository as any).normalizeBaseTime(now, "daily");
      const expected = new Date("2024-01-01T12:00:00").getTime(); // 14시는 12시로 정규화 (3시간 단위)
      // WeatherRepository는 daily 캐시 키 버전업을 위해 baseTime에 +1ms 오프셋을 적용한다.
      expect(normalized).toBe(expected + 1);
    });
  });

  describe("현재 날씨 조회", () => {
    it("캐시된 데이터가 있으면 캐시를 반환해야 함", async () => {
      // 캐시 메소드를 모킹
      const cacheSpy = vi.spyOn(weatherCache, "getNow").mockResolvedValue({
        data: mockWeatherNow,
        isStale: false,
        expiresAt: Date.now() + 600000, // 10분 후
      });

      const result = await repository.getNow("grid_60_127");
      expect(result).toEqual(mockWeatherNow);
      expect(cacheSpy).toHaveBeenCalledWith("grid_60_127", expect.any(Number));

      cacheSpy.mockRestore();
    });

    it("캐시가 없으면 API를 호출하고 캐시해야 함", async () => {
      // 캐시가 비어있고 API 성공하는 경우 모킹
      const cacheGetSpy = vi.spyOn(weatherCache, "getNow").mockResolvedValue(null);
      const cacheSetSpy = vi.spyOn(weatherCache, "setNow").mockResolvedValue(undefined);
      const locationSpy = vi.spyOn(weatherCache, "getLocation").mockResolvedValue(mockLocation);

      // KMA 프로바이더 모킹
      const mockKmaProvider = {
        getCurrentWeather: vi.fn().mockResolvedValue(mockWeatherNow),
      };
      (repository as any).kmaProvider = mockKmaProvider;

      const result = await repository.getNow("grid_60_127");
      expect(result).toEqual(mockWeatherNow);

      // 캐시 저장이 호출되었어야 함
      expect(cacheSetSpy).toHaveBeenCalled();

      cacheGetSpy.mockRestore();
      cacheSetSpy.mockRestore();
      locationSpy.mockRestore();
    });

    it("API 호출 실패 시 캐시된 데이터를 반환해야 함", async () => {
      // 캐시 없음 + API 실패
      const cacheSpy = vi.spyOn(weatherCache, "getNow").mockResolvedValue(null);
      const locationSpy = vi.spyOn(weatherCache, "getLocation").mockResolvedValue(mockLocation);

      // KMA 프로바이더 모킹 (실패)
      const mockKmaProvider = {
        getCurrentWeather: vi.fn().mockRejectedValue(new Error("API Error")),
      };
      (repository as any).kmaProvider = mockKmaProvider;

      const result = await repository.getNow("grid_60_127");
      expect(result).toBeNull();

      cacheSpy.mockRestore();
      locationSpy.mockRestore();
    });
  });

  describe("시간별 날씨 조회", () => {
    it("캐시된 데이터가 있으면 캐시를 반환해야 함", async () => {
      const cacheSpy = vi.spyOn(weatherCache, "getHourly").mockResolvedValue({
        data: mockWeatherHourly,
        isStale: false,
        expiresAt: Date.now() + 3600000, // 1시간 후
      });

      const result = await repository.getHourly("grid_60_127");
      expect(result).toEqual(mockWeatherHourly);

      cacheSpy.mockRestore();
    });
  });

  describe("일별 날씨 조회", () => {
    it("캐시된 데이터가 있으면 캐시를 반환해야 함", async () => {
      const cacheSpy = vi
        .spyOn(weatherCache, "getDaily")
        .mockResolvedValueOnce({
          data: mockWeatherDaily,
          isStale: false,
          expiresAt: Date.now() + 21600000, // 6시간 후
        })
        .mockResolvedValueOnce({
          data: [],
          isStale: false,
          expiresAt: Date.now() + 21600000, // 6시간 후
        });

      const result = await repository.getDaily("grid_60_127");
      expect(result).toEqual(mockWeatherDaily);

      cacheSpy.mockRestore();
    });
  });

  describe("대기질 조회", () => {
    it("캐시된 데이터가 있으면 캐시를 반환해야 함", async () => {
      const cacheSpy = vi.spyOn(weatherCache, "getAirQuality").mockResolvedValue({
        data: mockAirQuality,
        isStale: false,
        expiresAt: Date.now() + 3600000, // 1시간 후
      });

      const result = await repository.getAirQuality("grid_60_127");
      expect(result).toEqual(mockAirQuality);

      cacheSpy.mockRestore();
    });
  });

  describe("위치 정보 관리", () => {
    it("좌표로부터 위치 정보를 생성해야 함", async () => {
      // 캐시에 위치 정보가 없는 경우 모킹
      const cacheGetSpy = vi.spyOn(weatherCache, "getLocation").mockResolvedValue(null);
      const cacheSetSpy = vi.spyOn(weatherCache, "setLocation").mockResolvedValue(undefined);

      // VWorld 프로바이더 모킹
      const mockVWorldProvider = {
        reverseGeocode: vi.fn().mockResolvedValue("서울특별시 중구 명동"),
      };
      (repository as any).vworldProvider = mockVWorldProvider;

      const location = await repository.getOrCreateLocation(37.5665, 126.978);
      expect(location).toBeDefined();
      expect(location.id).toMatch(/^grid_\d+_\d+$/);
      expect(location.name).toBe("서울특별시 중구 명동");

      cacheGetSpy.mockRestore();
      cacheSetSpy.mockRestore();
    });

    it("역지오코딩 실패 시 기본 주소로 생성해야 함", async () => {
      // 캐시 없음 + VWorld 실패 모킹
      const cacheGetSpy = vi.spyOn(weatherCache, "getLocation").mockResolvedValue(null);
      const cacheSetSpy = vi.spyOn(weatherCache, "setLocation").mockResolvedValue(undefined);

      const mockVWorldProvider = {
        reverseGeocode: vi.fn().mockRejectedValue(new Error("Geocoding failed")),
      };
      (repository as any).vworldProvider = mockVWorldProvider;

      const location = await repository.getOrCreateLocation(37.5665, 126.978);
      expect(location).toBeDefined();
      expect(location.name).toMatch(/^\d+\.\d+, \d+\.\d+$/); // 좌표 형식

      cacheGetSpy.mockRestore();
      cacheSetSpy.mockRestore();
    });
  });

  describe("캐시 상태 확인", () => {
    it("캐시된 데이터 존재 여부를 확인해야 함", async () => {
      const hasData = await repository.hasCachedData("grid_60_127");
      expect(typeof hasData).toBe("boolean");
    });
  });

  describe("캐시 정리", () => {
    it("만료된 캐시를 정리해야 함", async () => {
      await expect(repository.cleanup()).resolves.not.toThrow();
    });
  });
});
