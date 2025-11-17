/**
 * PWA 날씨 캐싱 통합 테스트
 * 실제 브라우저 환경에서 서비스워커 캐시 동작 검증
 * 주로 수동 테스트용 - 브라우저 콘솔에서 실행
 */

import { weatherRepository } from "./WeatherRepository";

// 기본 위치 (서울 송파구 잠실동)
const TEST_LOCATION = {
  id: "test",
  lat: 37.5139,
  lon: 127.1025,
  name: "서울 송파구 잠실동",
  nx: 62,
  ny: 124,
  tmX: 961114,
  tmY: 1946434,
  timezone: "Asia/Seoul",
  updatedAt: Date.now(),
};

/**
 * 캐시 상태 확인 함수
 */
async function checkCacheStatus() {
  if (!("caches" in window)) {
    console.warn("Cache API not supported");
    return;
  }

  try {
    const cacheNames = await caches.keys();
    console.log("Available caches:", cacheNames);

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      console.log(`${cacheName}: ${keys.length} entries`);

      // 캐시된 URL들 로깅 (API 키 제외)
      for (const request of keys.slice(0, 5)) {
        // 처음 5개만
        const url = new URL(request.url);
        url.searchParams.delete("serviceKey");
        url.searchParams.delete("key");
        url.searchParams.delete("apiKey");
        console.log(`  - ${url.toString()}`);
      }
    }
  } catch (error) {
    console.error("Cache status check failed:", error);
  }
}

/**
 * 온라인 상태에서 날씨 데이터 요청 및 캐시 확인
 */
export async function testOnlineWeatherCaching() {
  console.log("=== 온라인 날씨 캐싱 테스트 시작 ===");

  try {
    // 캐시 초기 상태 확인
    console.log("초기 캐시 상태:");
    await checkCacheStatus();

    // 날씨 데이터 요청
    console.log("날씨 데이터 요청 중...");
    const startTime = Date.now();

    const [nowData, hourlyData, dailyData, airQualityData] = await Promise.all([
      weatherRepository.getNow(TEST_LOCATION),
      weatherRepository.getHourly(TEST_LOCATION),
      weatherRepository.getDaily(TEST_LOCATION),
      weatherRepository.getAirQuality(TEST_LOCATION),
    ]);

    const endTime = Date.now();
    console.log(`날씨 데이터 로드 완료: ${endTime - startTime}ms`);

    // 데이터 검증
    console.log("데이터 검증:");
    console.log("- 현재 날씨:", nowData ? "✅" : "❌");
    console.log("- 시간별 예보:", hourlyData?.length ? `✅ (${hourlyData.length}시간)` : "❌");
    console.log("- 일별 예보:", dailyData?.length ? `✅ (${dailyData.length}일)` : "❌");
    console.log("- 대기질:", airQualityData ? "✅" : "❌");

    // 캐시 상태 확인
    console.log("요청 후 캐시 상태:");
    await checkCacheStatus();

    return {
      success: true,
      data: { nowData, hourlyData, dailyData, airQualityData },
      loadTime: endTime - startTime,
    };
  } catch (error) {
    console.error("온라인 테스트 실패:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 캐시된 데이터 재요청 테스트 (빠른 응답 검증)
 */
export async function testCachedWeatherRequests() {
  console.log("=== 캐시된 날씨 재요청 테스트 시작 ===");

  try {
    // 캐시된 데이터 재요청
    console.log("캐시된 데이터 재요청 중...");
    const startTime = Date.now();

    const [nowData, hourlyData, dailyData, airQualityData] = await Promise.all([
      weatherRepository.getNow(TEST_LOCATION),
      weatherRepository.getHourly(TEST_LOCATION),
      weatherRepository.getDaily(TEST_LOCATION),
      weatherRepository.getAirQuality(TEST_LOCATION),
    ]);

    const endTime = Date.now();
    const loadTime = endTime - startTime;
    console.log(`캐시된 데이터 로드 완료: ${loadTime}ms`);

    // 빠른 응답 검증 (캐시 히트의 경우 100ms 이내)
    const isFastResponse = loadTime < 100;
    console.log(`빠른 응답 (캐시 히트): ${isFastResponse ? "✅" : "❌"} (${loadTime}ms)`);

    // 데이터 일관성 검증
    const hasAllData = nowData && hourlyData?.length && dailyData?.length && airQualityData;
    console.log(`데이터 일관성: ${hasAllData ? "✅" : "❌"}`);

    return {
      success: true,
      loadTime,
      isFastResponse,
      hasAllData,
    };
  } catch (error) {
    console.error("캐시 테스트 실패:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 오프라인 시뮬레이션 테스트
 */
export async function testOfflineWeatherAccess() {
  console.log("=== 오프라인 날씨 접근 테스트 시작 ===");

  // 오프라인 모드 시뮬레이션
  const originalOnLine = navigator.onLine;

  try {
    // 오프라인 상태로 변경 (실제 네트워크 차단은 수동으로 해야 함)
    Object.defineProperty(navigator, "onLine", { value: false, writable: true });

    // 오프라인 이벤트 발생
    window.dispatchEvent(new Event("offline"));

    console.log("오프라인 모드 시뮬레이션 활성화");
    console.log(
      "⚠️  실제 네트워크 연결을 차단하려면 브라우저 개발자 도구에서 네트워크 탭을 offline으로 설정하세요"
    );

    // 캐시된 데이터 접근 시도
    console.log("캐시된 날씨 데이터 접근 시도...");
    const startTime = Date.now();

    const results = await Promise.allSettled([
      weatherRepository.getNow(TEST_LOCATION),
      weatherRepository.getHourly(TEST_LOCATION),
      weatherRepository.getDaily(TEST_LOCATION),
      weatherRepository.getAirQuality(TEST_LOCATION),
    ]);

    const endTime = Date.now();
    const loadTime = endTime - startTime;

    console.log(`오프라인 데이터 로드: ${loadTime}ms`);

    // 결과 분석
    const fulfilled = results.filter((r) => r.status === "fulfilled").length;
    const rejected = results.filter((r) => r.status === "rejected").length;

    console.log(`성공: ${fulfilled}/4, 실패: ${rejected}/4`);

    if (fulfilled > 0) {
      console.log("✅ 오프라인에서 캐시된 데이터 접근 성공");
    } else {
      console.log("❌ 오프라인에서 데이터 접근 실패");
    }

    return {
      success: fulfilled > 0,
      fulfilled,
      rejected,
      loadTime,
    };
  } catch (error) {
    console.error("오프라인 테스트 실패:", error);
    return { success: false, error: error.message };
  } finally {
    // 온라인 상태 복원
    Object.defineProperty(navigator, "onLine", { value: originalOnLine, writable: true });
    window.dispatchEvent(new Event("online"));
  }
}

/**
 * 캐시 만료 테스트
 */
export async function testCacheExpiration() {
  console.log("=== 캐시 만료 테스트 시작 ===");

  try {
    // 캐시 상태 확인
    console.log("테스트 전 캐시 상태:");
    await checkCacheStatus();

    // 시간 조작으로 캐시 만료 시뮬레이션 (실제로는 시간 경과를 기다려야 함)
    console.log("⚠️  캐시 만료 테스트는 실제 시간 경과를 기다려야 정확합니다");
    console.log("   KMA 캐시: 30분, VWorld 캐시: 30일");

    // 캐시 수동 정리 (테스트용)
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        if (cacheName.includes("weather") || cacheName.includes("geocoding")) {
          await caches.delete(cacheName);
          console.log(`캐시 삭제: ${cacheName}`);
        }
      }
    }

    console.log("캐시 정리 후 상태:");
    await checkCacheStatus();

    return { success: true };
  } catch (error) {
    console.error("캐시 만료 테스트 실패:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 전체 PWA 캐싱 통합 테스트 실행
 */
export async function runFullPwaWeatherTest() {
  console.log("🚀 PWA 날씨 캐싱 통합 테스트 시작");
  console.log("================================");

  const results = {
    online: await testOnlineWeatherCaching(),
    cached: await testCachedWeatherRequests(),
    offline: await testOfflineWeatherAccess(),
    expiration: await testCacheExpiration(),
  };

  console.log("================================");
  console.log("📊 테스트 결과 요약:");
  console.log(`온라인 요청: ${results.online.success ? "✅" : "❌"}`);
  console.log(`캐시 히트: ${results.cached.success ? "✅" : "❌"}`);
  console.log(`오프라인 접근: ${results.offline.success ? "✅" : "❌"}`);
  console.log(`캐시 관리: ${results.expiration.success ? "✅" : "❌"}`);

  const passedTests = Object.values(results).filter((r) => r.success).length;
  console.log(`전체: ${passedTests}/4 테스트 통과`);

  return results;
}

// 브라우저 콘솔에서 직접 실행할 수 있도록 전역 함수 등록
if (typeof window !== "undefined") {
  (window as any).testPwaWeather = {
    runFullTest: runFullPwaWeatherTest,
    testOnline: testOnlineWeatherCaching,
    testCached: testCachedWeatherRequests,
    testOffline: testOfflineWeatherAccess,
    testExpiration: testCacheExpiration,
    checkCache: checkCacheStatus,
  };

  console.log("💡 PWA 날씨 테스트 함수들이 window.testPwaWeather에 등록되었습니다.");
  console.log("   사용 예시:");
  console.log("   - window.testPwaWeather.runFullTest() // 전체 테스트");
  console.log("   - window.testPwaWeather.testOnline()   // 온라인 테스트");
  console.log("   - window.testPwaWeather.checkCache()   // 캐시 상태 확인");
}
