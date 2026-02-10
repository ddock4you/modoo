/**
 * AirKorea integration tests (real API) - dev only
 */

import { AirKoreaProvider } from "@/lib/weather/AirKoreaProvider";

const API_KEY = import.meta.env.VITE_AIRKOREA_SERVICE_KEY;

if (!API_KEY) {
  console.error("VITE_AIRKOREA_SERVICE_KEY is not set in .env");
}

export async function runAirKoreaIntegrationTests() {
  console.log("🧪 Starting AirKorea Integration Tests...\n");

  const provider = new AirKoreaProvider(API_KEY);

  try {
    console.log("📍 Test 1: Nearby Stations Search (Seoul Jongno-gu)");
    const seoulLat = 37.5665;
    const seoulLon = 126.9784;

    const { latLonToTM } = await import("@/lib/weather/coord");
    const { tmX, tmY } = latLonToTM(seoulLat, seoulLon);
    console.log(`   TM Coordinates: ${tmX}, ${tmY}`);

    const stations = await provider.getNearbyStations(tmX, tmY);
    console.log(`   ✅ Found ${stations.length} stations`);
    console.log(`   📊 Nearest station: ${stations[0]?.name} (${stations[0]?.distance}m)`);
    console.log("");

    console.log("🌫️  Test 2: Air Quality Data (종로구)");
    const airQuality = await provider.getAirQuality("종로구");
    console.log(`   ✅ Station: ${airQuality.stationName}`);
    console.log(`   📊 PM10: ${airQuality.pm10} µg/m³`);
    console.log(`   📊 PM2.5: ${airQuality.pm25} µg/m³`);
    console.log(`   📊 Air Quality: ${airQuality.aqiKorea}`);
    console.log(`   📅 Updated: ${new Date(airQuality.updatedAt).toLocaleString()}`);
    console.log("");

    console.log("🎯 Test 3: Integrated Location-based Query");
    const integratedResult = await provider.getAirQualityByLocation(seoulLat, seoulLon);
    console.log(`   ✅ Station: ${integratedResult.stationName}`);
    console.log(`   📊 PM10: ${integratedResult.pm10} µg/m³`);
    console.log(`   📊 PM2.5: ${integratedResult.pm25} µg/m³`);
    console.log(`   📊 Air Quality: ${integratedResult.aqiKorea}`);
    console.log("");

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

export async function runManualTests() {
  console.log("🔧 Manual AirKorea Tests - Run in browser console");
  console.log('Usage: import("@/dev/weather/test-airkorea-integration.ts").then(m => m.runAirKoreaIntegrationTests())');

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

if (typeof window !== "undefined" && import.meta.env.DEV) {
  console.log("🌐 AirKorea Manual Tests available in console");
  console.log("Run: runAirKoreaIntegrationTests() or runManualTests()");
  (window as any).runAirKoreaIntegrationTests = runAirKoreaIntegrationTests;
  (window as any).runAirKoreaManualTests = runManualTests;
}
