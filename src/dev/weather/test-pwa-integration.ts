/**
 * PWA weather caching integration tests - dev only
 */

import { weatherRepository } from "@/lib/weather/WeatherRepository";

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

async function checkCacheStatus() {
  if (!("caches" in window)) {
    console.warn("Cache API not supported");
    return;
  }

  const cacheNames = await caches.keys();
  console.log("Available caches:", cacheNames);

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    console.log(`${cacheName}: ${keys.length} entries`);

    for (const request of keys.slice(0, 5)) {
      const url = new URL(request.url);
      url.searchParams.delete("serviceKey");
      url.searchParams.delete("key");
      url.searchParams.delete("apiKey");
      console.log(`  - ${url.toString()}`);
    }
  }
}

export async function testOnlineWeatherCaching() {
  console.log("=== 온라인 날씨 캐싱 테스트 시작 ===");

  try {
    console.log("초기 캐시 상태:");
    await checkCacheStatus();

    console.log("날씨 데이터 요청 중...");
    const startTime = Date.now();

    const [nowData, hourlyData, dailyData, airQualityData] = await Promise.all([
      weatherRepository.getNow(TEST_LOCATION.id),
      weatherRepository.getHourly(TEST_LOCATION.id),
      weatherRepository.getDaily(TEST_LOCATION.id),
      weatherRepository.getAirQuality(TEST_LOCATION.id),
    ]);

    const endTime = Date.now();
    console.log(`날씨 데이터 로드 완료: ${endTime - startTime}ms`);
    console.log("데이터 검증:");
    console.log("- 현재 날씨:", nowData ? "✅" : "❌");
    console.log("- 시간별 예보:", hourlyData?.length ? `✅ (${hourlyData.length}시간)` : "❌");
    console.log("- 일별 예보:", dailyData?.length ? `✅ (${dailyData.length}일)` : "❌");
    console.log("- 대기질:", airQualityData ? "✅" : "❌");

    console.log("요청 후 캐시 상태:");
    await checkCacheStatus();

    return {
      success: true,
      data: { nowData, hourlyData, dailyData, airQualityData },
      loadTime: endTime - startTime,
    };
  } catch (error) {
    console.error("온라인 테스트 실패:", error);
    return { success: false, error: (error as Error).message };
  }
}

if (typeof window !== "undefined") {
  (window as any).testPwaWeather = {
    testOnline: testOnlineWeatherCaching,
    checkCache: checkCacheStatus,
  };
}
