/**
 * AirKorea manual tests (browser console)
 */

const API_KEY = import.meta.env.VITE_AIRKOREA_SERVICE_KEY;

if (!API_KEY) {
  console.error("❌ VITE_AIRKOREA_SERVICE_KEY is not set in .env file");
}

export async function testApiConnection() {
  console.log("🔗 Testing AirKorea API connection...");

  try {
    const testTmX = 198000;
    const testTmY = 451000;

    const params = new URLSearchParams({
      serviceKey: API_KEY,
      returnType: "json",
      tmX: testTmX.toString(),
      tmY: testTmY.toString(),
      ver: "1.0",
    });

    const stationUrl = `https://apis.data.go.kr/B552584/MsrstnInfoInqireSvc/getNearbyMsrstnList?${params}`;
    console.log("📡 Requesting:", stationUrl);

    const stationResponse = await fetch(stationUrl);
    const stationData = await stationResponse.json();

    console.log("📊 Station API Response:", stationData);

    if (stationData.response?.header?.resultCode === "00") {
      console.log("✅ Station API: Connected successfully");
      console.log(`📍 Found ${stationData.response.body.items.length} stations`);
    } else {
      console.log("❌ Station API Error:", stationData.response?.header?.resultMsg);
    }

    if (stationData.response?.body?.items?.length > 0) {
      const nearestStation = stationData.response.body.items[0].stationName;

      const aqParams = new URLSearchParams({
        serviceKey: API_KEY,
        returnType: "json",
        stationName: nearestStation,
        dataTerm: "DAILY",
        ver: "1.0",
      });

      const aqUrl = `https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty?${aqParams}`;
      console.log("📡 Requesting:", aqUrl);

      const aqResponse = await fetch(aqUrl);
      const aqData = await aqResponse.json();

      console.log("🌫️  Air Quality API Response:", aqData);

      if (aqData.response?.header?.resultCode === "00") {
        console.log("✅ Air Quality API: Connected successfully");
        const data = aqData.response.body.items[0];
        console.log(
          `📊 ${data.stationName}: PM10=${data.pm10Value}, PM2.5=${data.pm25Value}, Grade=${data.khaiGrade}(${data.khaiValue})`
        );
      } else {
        console.log("❌ Air Quality API Error:", aqData.response?.header?.resultMsg);
      }
    }
  } catch (error) {
    console.error("❌ API Connection test failed:", error);
  }
}

export async function testCoordinateConversion() {
  console.log("🗺️  Testing coordinate conversion...");
  try {
    const { latLonToTM } = await import("@/lib/weather/coord");

    const testCoords = [
      { name: "종로구", lat: 37.5665, lon: 126.9784 },
      { name: "강남구", lat: 37.5172, lon: 127.0473 },
      { name: "부산 중구", lat: 35.1796, lon: 129.0756 },
    ];

    for (const coord of testCoords) {
      const { tmX, tmY } = latLonToTM(coord.lat, coord.lon);
      console.log(`📍 ${coord.name}: (${coord.lat}, ${coord.lon}) → TM(${tmX}, ${tmY})`);
    }
    console.log("✅ Coordinate conversion test completed");
  } catch (error) {
    console.error("❌ Coordinate conversion test failed:", error);
  }
}

export async function testGeolocation() {
  console.log("📍 Testing geolocation and air quality lookup...");

  if (!("geolocation" in navigator)) {
    console.error("❌ Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      console.log(`📍 Current position: ${latitude}, ${longitude}`);

      try {
        const { AirKoreaProvider } = await import("@/lib/weather/AirKoreaProvider");
        const provider = new AirKoreaProvider(API_KEY);
        const result = await provider.getAirQualityByLocation(latitude, longitude);
        console.log("✅ Air Quality Result:", result);
      } catch (error) {
        console.error("❌ Geolocation test failed:", error);
      }
    },
    (error) => {
      console.error("❌ Geolocation access denied:", error);
    }
  );
}

export async function testErrorHandling() {
  console.log("⚠️  Testing error handling and fallbacks...");

  try {
    const { AirKoreaProvider } = await import("@/lib/weather/AirKoreaProvider");
    const provider = new AirKoreaProvider(API_KEY);

    console.log("Testing with invalid coordinates...");
    const invalidResult = await provider.getAirQualityByLocation(999, 999);
    console.log("✅ Fallback worked:", invalidResult);
  } catch (error) {
    console.error("❌ Error handling test failed:", error);
  }
}

export async function runAllManualTests() {
  console.log("🚀 Running all AirKorea manual tests...\n");
  await testCoordinateConversion();
  console.log("");
  await testApiConnection();
  console.log("");
  await testGeolocation();
  console.log("");
  await testErrorHandling();
  console.log("");
  console.log("✨ All manual tests completed!");
}

if (typeof window !== "undefined" && import.meta.env.DEV) {
  console.log("🧪 AirKorea Manual Tests loaded!");
  console.log("Available functions:");
  console.log("- testApiConnection()");
  console.log("- testCoordinateConversion()");
  console.log("- testGeolocation()");
  console.log("- testErrorHandling()");
  console.log("- runAllManualTests()");

  (window as any).testApiConnection = testApiConnection;
  (window as any).testCoordinateConversion = testCoordinateConversion;
  (window as any).testGeolocation = testGeolocation;
  (window as any).testErrorHandling = testErrorHandling;
  (window as any).runAllManualTests = runAllManualTests;
}
