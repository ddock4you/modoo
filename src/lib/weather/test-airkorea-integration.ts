/**
 * AirKorea 통합 테스트
 * 실제 API 호출을 통한 테스트 (개발 시에만 사용)
 */

import { AirKoreaProvider } from "./AirKoreaProvider";

// 실제 API 키는 .env에서 가져옴
const API_KEY = import.meta.env.VITE_AIRKOREA_SERVICE_KEY;

if (!API_KEY) {
  console.error("VITE_AIRKOREA_SERVICE_KEY is not set in .env");
}

/**
 * 실제 API를 통한 통합 테스트
 */
export async function runAirKoreaIntegrationTests() {
  console.log("🧪 Starting AirKorea Integration Tests...\n");

  const provider = new AirKoreaProvider(API_KEY);

  try {
    // Test 1: 서울 종로구 좌표로 근접 측정소 검색
    console.log("📍 Test 1: Nearby Stations Search (Seoul Jongno-gu)");
    const seoulLat = 37.5665;
    const seoulLon = 126.9784;

    const { latLonToTM } = await import("./coord");
    const { tmX, tmY } = latLonToTM(seoulLat, seoulLon);
    console.log(`   TM Coordinates: ${tmX}, ${tmY}`);

    const stations = await provider.getNearbyStations(tmX, tmY);
    console.log(`   ✅ Found ${stations.length} stations`);
    console.log(`   📊 Nearest station: ${stations[0]?.name} (${stations[0]?.distance}m)`);
    console.log("");

    // Test 2: 대기질 데이터 조회
    console.log("🌫️  Test 2: Air Quality Data (종로구)");
    const airQuality = await provider.getAirQuality("종로구");
    console.log(`   ✅ Station: ${airQuality.stationName}`);
    console.log(`   📊 PM10: ${airQuality.pm10} µg/m³`);
    console.log(`   📊 PM2.5: ${airQuality.pm25} µg/m³`);
    console.log(`   📊 Air Quality: ${airQuality.aqiKorea}`);
    console.log(`   📅 Updated: ${new Date(airQuality.updatedAt).toLocaleString()}`);
    console.log("");

    // Test 3: 좌표 기반 통합 조회
    console.log("🎯 Test 3: Integrated Location-based Query");
    const integratedResult = await provider.getAirQualityByLocation(seoulLat, seoulLon);
    console.log(`   ✅ Station: ${integratedResult.stationName}`);
    console.log(`   📊 PM10: ${integratedResult.pm10} µg/m³`);
    console.log(`   📊 PM2.5: ${integratedResult.pm25} µg/m³`);
    console.log(`   📊 Air Quality: ${integratedResult.aqiKorea}`);
    console.log("");

    // Test 4: 다른 지역 테스트 (부산)
    console.log("🏖️  Test 4: Different Location (Busan)");
    const busanLat = 35.1796;
    const busanLon = 129.0756;
    const busanResult = await provider.getAirQualityByLocation(busanLat, busanLon);
    console.log(`   ✅ Station: ${busanResult.stationName}`);
    console.log(`   📊 PM10: ${busanResult.pm10} µg/m³`);
    console.log(`   📊 PM2.5: ${busanResult.pm25} µg/m³`);
    console.log(`   📊 Air Quality: ${busanResult.aqiKorea}`);
    console.log("");

    console.log("✅ All integration tests passed!");
  } catch (error) {
    console.error("❌ Integration test failed:", error);
    throw error;
  }
}

/**
 * 브라우저 콘솔에서 수동 테스트 실행
 * 개발자 도구 콘솔에서: import('./test-airkorea-integration.ts').then(m => m.runAirKoreaIntegrationTests())
 */
export async function runManualTests() {
  console.log("🔧 Manual AirKorea Tests - Run in browser console");
  console.log(
    'Usage: import("./test-airkorea-integration.ts").then(m => m.runAirKoreaIntegrationTests())'
  );

  // GPS 기반 테스트
  if ("geolocation" in navigator) {
    console.log("📍 GPS Test: Getting current location...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`📍 Current location: ${latitude}, ${longitude}`);

        try {
          const provider = new AirKoreaProvider(API_KEY);
          const result = await provider.getAirQualityByLocation(latitude, longitude);
          console.log("✅ GPS-based result:", result);
        } catch (error) {
          console.error("❌ GPS test failed:", error);
        }
      },
      (error) => {
        console.error("❌ GPS access failed:", error);
      }
    );
  } else {
    console.log("⚠️  Geolocation not supported");
  }
}

// 브라우저 환경에서 자동 실행 (개발용)
if (typeof window !== "undefined" && import.meta.env.DEV) {
  console.log("🌐 AirKorea Manual Tests available in console");
  console.log("Run: runAirKoreaIntegrationTests() or runManualTests()");

  // 전역 함수로 등록
  (window as any).runAirKoreaIntegrationTests = runAirKoreaIntegrationTests;
  (window as any).runAirKoreaManualTests = runManualTests;
}
