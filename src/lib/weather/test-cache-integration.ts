/**
 * IndexedDbWeatherCache 통합 테스트
 * 실제 IndexedDB 환경에서 캐시 동작을 검증합니다.
 *
 * 이 파일은 수동으로 실행하여 브라우저 환경에서 캐시 기능을 테스트합니다.
 * 실제 IndexedDB에 데이터를 저장하고 조회하는지 확인합니다.
 */

import { weatherCache } from "./IndexedDbWeatherCache";
import { initDB } from "../storage/db";
import type {
  WeatherNow,
  WeatherHourlyPoint,
  WeatherDailyPoint,
  AirQuality,
  WeatherLocation,
} from "../../domain/types";

// 테스트 데이터
const testLocationId = "37.57,126.98";
const testBaseTime = Date.now();

const mockWeatherNow: WeatherNow = {
  tempC: 22.5,
  humidityPct: 65,
  windMs: 2.8,
  precipProbPct: 20,
  weatherCode: { sky: 2, pty: 0 },
  updatedAt: Date.now(),
};

const mockWeatherHourly: WeatherHourlyPoint[] = [
  {
    time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1시간 후
    tempC: 23.0,
    humidityPct: 60,
    precipProbPct: 10,
    sky: 2,
    pty: 0,
  },
  {
    time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2시간 후
    tempC: 24.0,
    humidityPct: 55,
    precipProbPct: 5,
    sky: 1,
    pty: 0,
  },
];

const mockWeatherDaily: WeatherDailyPoint[] = [
  {
    date: new Date().toISOString().split("T")[0], // 오늘
    minC: 18.0,
    maxC: 26.0,
    precipProbMaxPct: 20,
    sky: 2,
    pty: 0,
  },
  {
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 내일
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

/**
 * 캐시 저장 및 조회 테스트
 */
async function testCacheStorage(): Promise<void> {
  console.log("=== 캐시 저장 및 조회 테스트 ===");

  try {
    // 1. 위치 정보 저장
    console.log("1. 위치 정보 저장...");
    await weatherCache.setLocation(mockLocation);

    // 2. 현재 날씨 데이터 저장
    console.log("2. 현재 날씨 데이터 저장...");
    await weatherCache.setNow(testLocationId, testBaseTime, mockWeatherNow);

    // 3. 시간별 날씨 데이터 저장
    console.log("3. 시간별 날씨 데이터 저장...");
    await weatherCache.setHourly(testLocationId, testBaseTime, mockWeatherHourly);

    // 4. 일별 날씨 데이터 저장
    console.log("4. 일별 날씨 데이터 저장...");
    await weatherCache.setDaily(testLocationId, testBaseTime, mockWeatherDaily);

    // 5. 대기질 데이터 저장
    console.log("5. 대기질 데이터 저장...");
    await weatherCache.setAirQuality(testLocationId, testBaseTime, mockAirQuality);

    console.log("✅ 모든 데이터 저장 완료");

    // 조회 테스트
    console.log("\n=== 데이터 조회 테스트 ===");

    // 1. 위치 정보 조회
    const location = await weatherCache.getLocation(testLocationId);
    console.log("1. 위치 정보 조회:", location ? "✅ 성공" : "❌ 실패");
    if (location) {
      console.log(`   - 이름: ${location.name}`);
      console.log(`   - 좌표: (${location.lat}, ${location.lon})`);
    }

    // 2. 현재 날씨 조회
    const nowData = await weatherCache.getNow(testLocationId, testBaseTime);
    console.log("2. 현재 날씨 조회:", nowData ? "✅ 성공" : "❌ 실패");
    if (nowData) {
      console.log(`   - 온도: ${nowData.data.tempC}°C`);
      console.log(`   - 습도: ${nowData.data.humidityPct}%`);
      console.log(`   - 신선도: ${nowData.isStale ? "❌ 만료됨" : "✅ 신선함"}`);
    }

    // 3. 시간별 날씨 조회
    const hourlyData = await weatherCache.getHourly(testLocationId, testBaseTime);
    console.log("3. 시간별 날씨 조회:", hourlyData ? "✅ 성공" : "❌ 실패");
    if (hourlyData) {
      console.log(`   - 데이터 개수: ${hourlyData.data.length}`);
      console.log(`   - 첫 번째 데이터 온도: ${hourlyData.data[0]?.tempC}°C`);
    }

    // 4. 일별 날씨 조회
    const dailyData = await weatherCache.getDaily(testLocationId, testBaseTime);
    console.log("4. 일별 날씨 조회:", dailyData ? "✅ 성공" : "❌ 실패");
    if (dailyData) {
      console.log(`   - 데이터 개수: ${dailyData.data.length}`);
      console.log(`   - 오늘 최고기온: ${dailyData.data[0]?.maxC}°C`);
    }

    // 5. 대기질 조회
    const airQualityData = await weatherCache.getAirQuality(testLocationId, testBaseTime);
    console.log("5. 대기질 조회:", airQualityData ? "✅ 성공" : "❌ 실패");
    if (airQualityData) {
      console.log(`   - PM10: ${airQualityData.data.pm10}`);
      console.log(`   - PM2.5: ${airQualityData.data.pm25}`);
      console.log(`   - 등급: ${airQualityData.data.aqiKorea}`);
    }
  } catch (error) {
    console.error("❌ 캐시 저장/조회 테스트 실패:", error);
  }
}

/**
 * TTL 및 만료 테스트
 */
async function testTTLAndExpiration(): Promise<void> {
  console.log("\n=== TTL 및 만료 테스트 ===");

  try {
    const testTime = Date.now();
    const shortTTLTime = testTime - 1000; // 1초 전 (만료된 데이터)

    // 만료된 데이터 저장 시뮬레이션
    console.log("1. 다양한 TTL 값 테스트...");

    // 현재 날씨 (10분 TTL) 저장 및 확인
    await weatherCache.setNow(testLocationId, testTime, mockWeatherNow);
    const nowData = await weatherCache.getNow(testLocationId, testTime);
    if (nowData) {
      const ttlMinutes = Math.round((nowData.expiresAt - Date.now()) / (60 * 1000));
      console.log(`   - 현재 날씨 TTL: 약 ${ttlMinutes}분`);
    }

    // 시간별 날씨 (60분 TTL) 저장 및 확인
    await weatherCache.setHourly(testLocationId, testTime, mockWeatherHourly);
    const hourlyData = await weatherCache.getHourly(testLocationId, testTime);
    if (hourlyData) {
      const ttlMinutes = Math.round((hourlyData.expiresAt - Date.now()) / (60 * 1000));
      console.log(`   - 시간별 날씨 TTL: 약 ${ttlMinutes}분`);
    }

    // 대기질 (60분 TTL) 저장 및 확인
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

/**
 * 브라우저 콘솔에서 실행할 수 있는 테스트 함수들
 */
export async function runCacheIntegrationTests(): Promise<void> {
  console.log("🚀 IndexedDbWeatherCache 통합 테스트 시작");
  console.log("실제 IndexedDB에 데이터를 저장하고 조회합니다.");

  await weatherCache.init();

  await testCacheStorage();
  await testTTLAndExpiration();

  console.log("\n🎉 통합 테스트 완료!");
  console.log(
    "브라우저 개발자 도구 > Application > IndexedDB에서 'modoo' 데이터베이스를 확인하세요."
  );
}

/**
 * 개별 테스트 함수들 (브라우저 콘솔에서 직접 호출 가능)
 */
(window as any).testWeatherCache = {
  runAll: runCacheIntegrationTests,
  storage: testCacheStorage,
  ttl: testTTLAndExpiration,
  cache: weatherCache,
};

// 브라우저 환경에서 자동 실행 (개발용)
if (typeof window !== "undefined" && import.meta.env.DEV) {
  console.log("💡 통합 테스트 함수들이 준비되었습니다:");
  console.log("  - testWeatherCache.runAll() : 전체 테스트 실행");
  console.log("  - testWeatherCache.storage() : 저장/조회 테스트");
  console.log("  - testWeatherCache.ttl() : TTL 테스트");
  console.log("  - testWeatherCache.cache : 캐시 인스턴스 직접 접근");
  console.log("  - testWeatherCache.checkDB() : DB 상태 확인");
  console.log("  - testWeatherCache.forceUpgrade() : DB 강제 업그레이드");
}

/**
 * DB 상태 확인 함수
 */
async function checkDBStatus(): Promise<void> {
  try {
    const db = await initDB();
    console.log("✅ DB 초기화 성공");
    console.log("📊 DB 버전:", db.version);
    console.log("📋 사용 가능한 스토어들:");
    for (const storeName of db.objectStoreNames) {
      console.log(`   - ${storeName}`);
    }

    // 각 스토어의 데이터 개수 확인
    const stores = [
      "weather_now",
      "weather_hourly",
      "weather_daily",
      "air_quality",
      "weather_locations",
    ];
    for (const storeName of stores) {
      try {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const count = await store.count();
        console.log(`   📊 ${storeName}: ${count}개 레코드`);
      } catch (error) {
        console.log(`   ❌ ${storeName}: 접근 불가 (${error})`);
      }
    }
  } catch (error) {
    console.error("❌ DB 초기화 실패:", error);
  }
}

/**
 * DB 강제 업그레이드 함수 (IndexedDB 완전 재생성)
 */
async function forceDBUpgrade(): Promise<void> {
  try {
    console.log("🔄 IndexedDB 완전 재생성 시도...");

    // 1. 기존 DB 연결 모두 종료
    if ((window as any).indexedDB) {
      const dbName = "modoo";
      const deleteRequest = (window as any).indexedDB.deleteDatabase(dbName);

      await new Promise((resolve, reject) => {
        deleteRequest.onsuccess = () => {
          console.log("🗑️ 기존 DB 삭제 완료");
          resolve(void 0);
        };
        deleteRequest.onerror = () => {
          console.warn("⚠️ DB 삭제 실패 (정상일 수 있음)");
          resolve(void 0); // 실패해도 계속 진행
        };
        deleteRequest.onblocked = () => {
          console.warn("⚠️ DB 삭제가 차단됨 (다른 탭에서 사용 중)");
          resolve(void 0);
        };
      });
    }

    // 2. 약간의 지연 후 새 DB 생성
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 3. 새로운 DB 생성 (버전 4로 강제 생성)
    const newDb = await initDB();
    console.log("✅ 새 DB 생성 완료, 버전:", newDb.version);
    newDb.close();

    console.log("🎉 DB 재생성 완료! 페이지를 새로고침하세요.");
  } catch (error) {
    console.error("❌ DB 재생성 실패:", error);
    console.log("💡 브라우저 시크릿 모드로 시도해보세요.");
  }
}

// 추가 함수들을 window 객체에 등록
(window as any).testWeatherCache = {
  ...((window as any).testWeatherCache || {}),
  checkDB: checkDBStatus,
  forceUpgrade: forceDBUpgrade,
};
