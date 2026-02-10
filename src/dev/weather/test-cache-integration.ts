/**
 * IndexedDbWeatherCache integration tests (browser console)
 */

import { weatherCache } from "@/lib/weather/IndexedDbWeatherCache";
import { initDB } from "@/lib/storage/db";
import type {
  AirQuality,
  WeatherDailyPoint,
  WeatherHourlyPoint,
  WeatherLocation,
  WeatherNow,
} from "@/domain/types";

const testLocationId = "37.57,126.98";
const testBaseTime = Date.now();

const mockWeatherNow: WeatherNow = {
  tempC: 22.5,
  humidityPct: 65,
  windMs: 2.8,
  precipProbPct: 20,
  weatherCode: { sky: 3, pty: 0 },
  updatedAt: Date.now(),
};

const mockWeatherHourly: WeatherHourlyPoint[] = [
  {
    time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
    tempC: 23.0,
    humidityPct: 60,
    precipProbPct: 10,
    sky: 3,
    pty: 0,
  },
  {
    time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    tempC: 24.0,
    humidityPct: 55,
    precipProbPct: 5,
    sky: 1,
    pty: 0,
  },
];

const mockWeatherDaily: WeatherDailyPoint[] = [
  {
    date: new Date().toISOString().split("T")[0],
    minC: 18.0,
    maxC: 26.0,
    precipProbMaxPct: 20,
    sky: 3,
    pty: 0,
  },
  {
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    minC: 19.0,
    maxC: 27.0,
    precipProbMaxPct: 10,
    sky: 1,
    pty: 0,
  },
];

const mockAirQuality: AirQuality = {
  pm10: 35,
  pm25: 18,
  aqiKorea: "좋음",
  stationName: "서울 중구",
  updatedAt: Date.now(),
};

const mockLocation: WeatherLocation = {
  id: testLocationId,
  name: "서울특별시 중구 명동",
  lat: 37.57,
  lon: 126.98,
  nx: 60,
  ny: 127,
  tmX: 197000,
  tmY: 453000,
  timezone: "Asia/Seoul",
  updatedAt: Date.now(),
};

async function testCacheStorage(): Promise<void> {
  console.log("=== 캐시 저장 및 조회 테스트 ===");

  try {
    console.log("1. 위치 정보 저장...");
    await weatherCache.setLocation(mockLocation);

    console.log("2. 현재 날씨 데이터 저장...");
    await weatherCache.setNow(testLocationId, testBaseTime, mockWeatherNow);

    console.log("3. 시간별 날씨 데이터 저장...");
    await weatherCache.setHourly(testLocationId, testBaseTime, mockWeatherHourly);

    console.log("4. 일별 날씨 데이터 저장...");
    await weatherCache.setDaily(testLocationId, testBaseTime, mockWeatherDaily, "short");

    console.log("5. 대기질 데이터 저장...");
    await weatherCache.setAirQuality(testLocationId, testBaseTime, mockAirQuality);

    console.log("✅ 모든 데이터 저장 완료");

    console.log("\n=== 데이터 조회 테스트 ===");
    const location = await weatherCache.getLocation(testLocationId);
    console.log("1. 위치 정보 조회:", location ? "✅ 성공" : "❌ 실패");

    const nowData = await weatherCache.getNow(testLocationId, testBaseTime);
    console.log("2. 현재 날씨 조회:", nowData ? "✅ 성공" : "❌ 실패");

    const hourlyData = await weatherCache.getHourly(testLocationId, testBaseTime);
    console.log("3. 시간별 날씨 조회:", hourlyData ? "✅ 성공" : "❌ 실패");

    const dailyData = await weatherCache.getDaily(testLocationId, testBaseTime, "short");
    console.log("4. 일별 날씨 조회:", dailyData ? "✅ 성공" : "❌ 실패");

    const airQualityData = await weatherCache.getAirQuality(testLocationId, testBaseTime);
    console.log("5. 대기질 조회:", airQualityData ? "✅ 성공" : "❌ 실패");
  } catch (error) {
    console.error("❌ 캐시 저장/조회 테스트 실패:", error);
  }
}

async function testTTLAndExpiration(): Promise<void> {
  console.log("\n=== TTL 및 만료 테스트 ===");

  try {
    const testTime = Date.now();

    await weatherCache.setNow(testLocationId, testTime, mockWeatherNow);
    const nowData = await weatherCache.getNow(testLocationId, testTime);
    if (nowData) {
      const ttlMinutes = Math.round((nowData.expiresAt - Date.now()) / (60 * 1000));
      console.log(`   - 현재 날씨 TTL: 약 ${ttlMinutes}분`);
    }

    await weatherCache.setHourly(testLocationId, testTime, mockWeatherHourly);
    const hourlyData = await weatherCache.getHourly(testLocationId, testTime);
    if (hourlyData) {
      const ttlMinutes = Math.round((hourlyData.expiresAt - Date.now()) / (60 * 1000));
      console.log(`   - 시간별 날씨 TTL: 약 ${ttlMinutes}분`);
    }

    await weatherCache.setAirQuality(testLocationId, testTime, mockAirQuality);
    const airQualityData = await weatherCache.getAirQuality(testLocationId, testTime);
    if (airQualityData) {
      const ttlMinutes = Math.round((airQualityData.expiresAt - Date.now()) / (60 * 1000));
      console.log(`   - 대기질 TTL: 약 ${ttlMinutes}분`);
    }

    console.log("2. 캐시 정리 실행...");
    await weatherCache.cleanupExpiredCache();
    console.log("   ✅ 캐시 정리 완료");
  } catch (error) {
    console.error("❌ TTL 및 만료 테스트 실패:", error);
  }
}

export async function runCacheIntegrationTests(): Promise<void> {
  console.log("🚀 IndexedDbWeatherCache 통합 테스트 시작");
  await weatherCache.init();
  await testCacheStorage();
  await testTTLAndExpiration();
  console.log("\n🎉 통합 테스트 완료!");
}

async function checkDBStatus(): Promise<void> {
  try {
    const db = await initDB();
    console.log("✅ DB 초기화 성공");
    console.log("📊 DB 버전:", db.version);
    console.log("📋 사용 가능한 스토어들:");
    for (const storeName of db.objectStoreNames) {
      console.log(`   - ${storeName}`);
    }
  } catch (error) {
    console.error("❌ DB 초기화 실패:", error);
  }
}

async function forceDBUpgrade(): Promise<void> {
  try {
    console.log("🔄 IndexedDB 완전 재생성 시도...");
    const dbName = "modoo";
    const deleteRequest = indexedDB.deleteDatabase(dbName);
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => resolve();
      deleteRequest.onblocked = () => resolve();
    });
    const newDb = await initDB();
    console.log("✅ 새 DB 생성 완료, 버전:", newDb.version);
    newDb.close();
  } catch (error) {
    console.error("❌ DB 재생성 실패:", error);
  }
}

// Global registration
(window as any).testWeatherCache = {
  runAll: runCacheIntegrationTests,
  storage: testCacheStorage,
  ttl: testTTLAndExpiration,
  cache: weatherCache,
  checkDB: checkDBStatus,
  forceUpgrade: forceDBUpgrade,
};

if (typeof window !== "undefined" && import.meta.env.DEV) {
  console.log("💡 통합 테스트 함수들이 준비되었습니다:");
  console.log("  - testWeatherCache.runAll() : 전체 테스트 실행");
  console.log("  - testWeatherCache.storage() : 저장/조회 테스트");
  console.log("  - testWeatherCache.ttl() : TTL 테스트");
  console.log("  - testWeatherCache.checkDB() : DB 상태 확인");
  console.log("  - testWeatherCache.forceUpgrade() : DB 강제 업그레이드");
}
