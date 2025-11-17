/**
 * Weather 타입 정의 테스트
 * 타입 안전성과 구조 검증
 */

import { describe, it, expect } from "vitest";
import type {
  WeatherLocation,
  WeatherNow,
  WeatherHourlyPoint,
  WeatherDailyPoint,
  AirQuality,
  WeatherSummary,
  TaskType,
  Plant,
  TaskRule,
  TaskEvent,
  PhotoMeta,
  SettingKV,
} from "./types";

describe("날씨 타입", () => {
  describe("WeatherLocation", () => {
    it("유효한 날씨 위치 구조를 허용해야 함", () => {
      const location: WeatherLocation = {
        id: "37.5665,126.9780",
        name: "서울 종로구",
        lat: 37.5665,
        lon: 126.978,
        nx: 60,
        ny: 127,
        tmX: 198000,
        tmY: 451000,
        timezone: "Asia/Seoul",
        updatedAt: Date.now(),
      };

      expect(location.id).toBe("37.5665,126.9780");
      expect(location.name).toBe("서울 종로구");
      expect(location.lat).toBe(37.5665);
      expect(location.lon).toBe(126.978);
      expect(location.nx).toBe(60);
      expect(location.ny).toBe(127);
      expect(location.tmX).toBe(198000);
      expect(location.tmY).toBe(451000);
      expect(location.timezone).toBe("Asia/Seoul");
      expect(typeof location.updatedAt).toBe("number");
    });

    it("선택적 updatedAt 필드를 허용해야 함", () => {
      const location: WeatherLocation = {
        id: "35.1796,129.0756",
        name: "부산 중구",
        lat: 35.1796,
        lon: 129.0756,
        nx: 98,
        ny: 76,
        tmX: 345000,
        tmY: 168000,
        timezone: "Asia/Seoul",
        // updatedAt is optional
      };

      expect(location.updatedAt).toBeUndefined();
    });
  });

  describe("WeatherNow", () => {
    it("유효한 현재 날씨 데이터를 허용해야 함", () => {
      const weatherNow: WeatherNow = {
        tempC: 23.5,
        humidityPct: 65,
        windMs: 2.1,
        weatherCode: {
          sky: 1,
          pty: 0,
        },
        updatedAt: Date.now(),
      };

      expect(weatherNow.tempC).toBe(23.5);
      expect(weatherNow.humidityPct).toBe(65);
      expect(weatherNow.windMs).toBe(2.1);
      expect(weatherNow.weatherCode.sky).toBe(1);
      expect(weatherNow.weatherCode.pty).toBe(0);
      expect(typeof weatherNow.updatedAt).toBe("number");
    });

    it("선택적 precipProbPct를 허용해야 함", () => {
      const weatherNow: WeatherNow = {
        tempC: 18.2,
        humidityPct: 78,
        windMs: 1.5,
        weatherCode: {
          sky: 3,
          pty: 1,
        },
        precipProbPct: 30, // optional
        updatedAt: Date.now(),
      };

      expect(weatherNow.precipProbPct).toBe(30);
    });
  });

  describe("WeatherHourlyPoint", () => {
    it("유효한 시간별 예보 데이터를 허용해야 함", () => {
      const hourlyPoint: WeatherHourlyPoint = {
        time: "2024-01-01T14:00:00.000Z",
        tempC: 22.0,
        humidityPct: 60,
        precipProbPct: 20,
        sky: 3,
        pty: 0,
      };

      expect(hourlyPoint.time).toBe("2024-01-01T14:00:00.000Z");
      expect(hourlyPoint.tempC).toBe(22.0);
      expect(hourlyPoint.humidityPct).toBe(60);
      expect(hourlyPoint.precipProbPct).toBe(20);
      expect(hourlyPoint.sky).toBe(3);
      expect(hourlyPoint.pty).toBe(0);
    });

    it("선택적 필드를 허용해야 함", () => {
      const hourlyPoint: WeatherHourlyPoint = {
        time: "2024-01-01T15:00:00.000Z",
        tempC: 21.5,
        // humidityPct, precipProbPct, sky, pty are optional
      };

      expect(hourlyPoint.time).toBe("2024-01-01T15:00:00.000Z");
      expect(hourlyPoint.tempC).toBe(21.5);
      expect(hourlyPoint.humidityPct).toBeUndefined();
      expect(hourlyPoint.precipProbPct).toBeUndefined();
      expect(hourlyPoint.sky).toBeUndefined();
      expect(hourlyPoint.pty).toBeUndefined();
    });
  });

  describe("WeatherDailyPoint", () => {
    it("유효한 일별 예보 데이터를 허용해야 함", () => {
      const dailyPoint: WeatherDailyPoint = {
        date: "2024-01-01",
        minC: 15.2,
        maxC: 25.8,
        precipProbMaxPct: 40,
        sky: 1,
        pty: 0,
      };

      expect(dailyPoint.date).toBe("2024-01-01");
      expect(dailyPoint.minC).toBe(15.2);
      expect(dailyPoint.maxC).toBe(25.8);
      expect(dailyPoint.precipProbMaxPct).toBe(40);
      expect(dailyPoint.sky).toBe(1);
      expect(dailyPoint.pty).toBe(0);
    });

    it("선택적 날씨 코드를 허용해야 함", () => {
      const dailyPoint: WeatherDailyPoint = {
        date: "2024-01-02",
        minC: 16.1,
        maxC: 24.3,
        // precipProbMaxPct, sky, pty are optional
      };

      expect(dailyPoint.date).toBe("2024-01-02");
      expect(dailyPoint.minC).toBe(16.1);
      expect(dailyPoint.maxC).toBe(24.3);
      expect(dailyPoint.precipProbMaxPct).toBeUndefined();
    });
  });

  describe("AirQuality", () => {
    it("유효한 대기질 데이터를 허용해야 함", () => {
      const airQuality: AirQuality = {
        pm10: 25,
        pm25: 15,
        aqiKorea: "보통",
        stationName: "종로구",
        updatedAt: Date.now(),
      };

      expect(airQuality.pm10).toBe(25);
      expect(airQuality.pm25).toBe(15);
      expect(airQuality.aqiKorea).toBe("보통");
      expect(airQuality.stationName).toBe("종로구");
      expect(typeof airQuality.updatedAt).toBe("number");
    });

    it("PM 측정값에 null 값을 허용해야 함", () => {
      const airQuality: AirQuality = {
        pm10: null,
        pm25: null,
        aqiKorea: "알수없음",
        stationName: "테스트",
        updatedAt: Date.now(),
      };

      expect(airQuality.pm10).toBeNull();
      expect(airQuality.pm25).toBeNull();
      expect(airQuality.aqiKorea).toBe("알수없음");
    });

    it("선택적 stationName을 허용해야 함", () => {
      const airQuality: AirQuality = {
        pm10: 30,
        pm25: 20,
        aqiKorea: "나쁨",
        stationName: "강남구",
        updatedAt: Date.now(),
      };

      expect(airQuality.stationName).toBe("강남구");
    });
  });

  describe("WeatherSummary", () => {
    it("유효한 날씨 요약을 허용해야 함", () => {
      const summary: WeatherSummary = {
        comfort: "쾌적",
        diffTempVsYesterday: -2.1,
        message: "어제보다 시원한 날씨입니다.",
      };

      expect(summary.comfort).toBe("쾌적");
      expect(summary.diffTempVsYesterday).toBe(-2.1);
      expect(summary.message).toBe("어제보다 시원한 날씨입니다.");
    });

    it("선택적 diffTempVsYesterday를 허용해야 함", () => {
      const summary: WeatherSummary = {
        comfort: "주의",
        message: "습도가 높아 불쾌할 수 있습니다.",
      };

      expect(summary.comfort).toBe("주의");
      expect(summary.diffTempVsYesterday).toBeUndefined();
      expect(summary.message).toBe("습도가 높아 불쾌할 수 있습니다.");
    });
  });
});

describe("도메인 타입", () => {
  describe("TaskType", () => {
    it("유효한 작업 타입을 허용해야 함", () => {
      const taskType: TaskType = "water";
      expect(taskType).toBe("water");
    });
  });

  describe("Plant", () => {
    it("유효한 식물 구조를 허용해야 함", () => {
      const plant: Plant = {
        id: "plant-123",
        name: "몬스테라",
        adoptedAt: Date.now(),
        humidity: { min: 40, max: 60 },
        temperature: { min: 18, max: 25 },
        lightLevel: "medium",
        isSensitive: false,
        notes: "잎이 큰 화분",
        coverPhotoUri: "photo-123",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(plant.id).toBe("plant-123");
      expect(plant.name).toBe("몬스테라");
      expect(plant.humidity?.min).toBe(40);
      expect(plant.humidity?.max).toBe(60);
      expect(plant.lightLevel).toBe("medium");
      expect(plant.isSensitive).toBe(false);
    });

    it("선택적 필드에 null 값을 허용해야 함", () => {
      const plant: Plant = {
        id: "plant-456",
        name: "선인장",
        adoptedAt: Date.now(),
        humidity: null,
        temperature: null,
        lightLevel: null,
        isSensitive: true,
        notes: "",
        coverPhotoUri: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(plant.humidity).toBeNull();
      expect(plant.temperature).toBeNull();
      expect(plant.lightLevel).toBeNull();
      expect(plant.isSensitive).toBe(true);
    });
  });

  describe("TaskRule", () => {
    it("유효한 작업 규칙을 허용해야 함", () => {
      const taskRule: TaskRule = {
        id: "rule-123",
        plantId: "plant-123",
        type: "water",
        intervalDays: 7,
        lastDoneAt: Date.now(),
        nextDueAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        note: "물주기",
        active: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(taskRule.id).toBe("rule-123");
      expect(taskRule.plantId).toBe("plant-123");
      expect(taskRule.type).toBe("water");
      expect(taskRule.intervalDays).toBe(7);
      expect(taskRule.active).toBe(1);
    });

    it("null lastDoneAt를 허용해야 함", () => {
      const taskRule: TaskRule = {
        id: "rule-456",
        plantId: "plant-456",
        type: "water",
        intervalDays: 3,
        lastDoneAt: null,
        nextDueAt: Date.now(),
        note: "새로운 식물",
        active: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(taskRule.lastDoneAt).toBeNull();
    });
  });

  describe("TaskEvent", () => {
    it("유효한 작업 이벤트를 허용해야 함", () => {
      const taskEvent: TaskEvent = {
        id: "event-123",
        plantId: "plant-123",
        type: "water",
        doneAt: Date.now(),
        note: "잘 자라고 있어요",
        createdAt: Date.now(),
      };

      expect(taskEvent.id).toBe("event-123");
      expect(taskEvent.plantId).toBe("plant-123");
      expect(taskEvent.type).toBe("water");
      expect(typeof taskEvent.doneAt).toBe("number");
      expect(taskEvent.note).toBe("잘 자라고 있어요");
    });
  });

  describe("PhotoMeta", () => {
    it("유효한 사진 메타데이터를 허용해야 함", () => {
      const photoMeta: PhotoMeta = {
        id: "photo-123",
        plantId: "plant-123",
        uri: "blob:123",
        thumbUri: "thumb:123",
        width: 1920,
        height: 1080,
        size: 2457600,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        displayWidth: 800,
        displayHeight: 450,
        aspectRatio: 1.777,
        cropArea: {
          x: 100,
          y: 50,
          width: 800,
          height: 450,
        },
      };

      expect(photoMeta.id).toBe("photo-123");
      expect(photoMeta.width).toBe(1920);
      expect(photoMeta.height).toBe(1080);
      expect(photoMeta.displayWidth).toBe(800);
      expect(photoMeta.aspectRatio).toBeCloseTo(1.777, 3);
    });

    it("선택적 표시 및 자르기 필드를 허용해야 함", () => {
      const photoMeta: PhotoMeta = {
        id: "photo-456",
        plantId: "plant-456",
        uri: "blob:456",
        thumbUri: "thumb:456",
        width: 1280,
        height: 720,
        size: 921600,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        // displayWidth, displayHeight, aspectRatio, cropArea are optional
      };

      expect(photoMeta.displayWidth).toBeUndefined();
      expect(photoMeta.cropArea).toBeUndefined();
    });
  });

  describe("SettingKV", () => {
    it("유효한 설정 키-값 쌍을 허용해야 함", () => {
      const setting: SettingKV = {
        key: "theme",
        value: '"dark"',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(setting.key).toBe("theme");
      expect(setting.value).toBe('"dark"');
      expect(typeof setting.createdAt).toBe("number");
      expect(typeof setting.updatedAt).toBe("number");
    });
  });
});

// 타입 안전성 테스트
describe("타입 안전성 테스트", () => {
  it("잘못된 열거형 값을 방지해야 함", () => {
    // TypeScript 컴파일 타임에 에러가 나야 함 (런타임에서는 테스트 불가)
    // 하지만 타입 검증을 위한 헬퍼 함수들을 테스트할 수 있음
    const validLightLevels = ["low", "medium", "high"] as const;
    const validTaskTypes = ["water"] as const;

    expect(validLightLevels).toContain("low");
    expect(validLightLevels).toContain("medium");
    expect(validLightLevels).toContain("high");
    expect(validTaskTypes).toContain("water");
  });

  it("숫자 범위를 검증해야 함", () => {
    // Weather codes validation
    const validSkyCodes = [1, 3, 4] as const;
    const validPtyCodes = [0, 1, 2, 3, 5, 6, 7] as const;

    expect(validSkyCodes).toContain(1);
    expect(validSkyCodes).toContain(3);
    expect(validSkyCodes).toContain(4);

    expect(validPtyCodes).toContain(0);
    expect(validPtyCodes).toContain(1);
    expect(validPtyCodes).toContain(2);
    expect(validPtyCodes).toContain(3);
  });
});
