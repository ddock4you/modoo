/**
 * VWorld reverse geocoding manual tests (browser console)
 */

import { VWorldGeocodingProvider } from "@/infrastructure/weather/clients/VWorldGeocodingClient";

const API_KEY = import.meta.env.VITE_VWORLD_API_KEY;

if (!API_KEY) {
  console.error("❌ VITE_VWORLD_API_KEY is not set in .env");
}

export async function testVWorldConnection() {
  console.log("🔗 VWorld API 연결 상태 테스트...");
  try {
    const provider = new VWorldGeocodingProvider(API_KEY);
    const testCoords = { lat: 37.5665, lon: 126.978 };
    const result = await provider.reverseGeocode(testCoords.lat, testCoords.lon);
    console.log("✅ VWorld API 연결 성공");
    console.log(`📍 테스트 좌표: ${testCoords.lat}, ${testCoords.lon}`);
    console.log(`🏠 변환된 주소: ${result}`);
  } catch (error) {
    console.error("❌ VWorld API 연결 실패:", error);
  }
}

export async function testReverseGeocode(lat: number = 37.5665, lon: number = 126.978) {
  console.log(`🗺️  역지오코딩 테스트 - 좌표: ${lat}, ${lon}`);
  try {
    const provider = new VWorldGeocodingProvider(API_KEY);
    const result = await provider.reverseGeocode(lat, lon);
    console.log("✅ 역지오코딩 성공");
    console.log(`📍 입력 좌표: ${lat}, ${lon}`);
    console.log(`🏠 결과 주소: ${result}`);
  } catch (error) {
    console.error("❌ 역지오코딩 실패:", error);
  }
}

export async function runAllVWorldTests() {
  console.log("🚀 VWorld 역지오코딩 전체 테스트 시작\n");

  try {
    await testVWorldConnection();
    console.log("");
    await testReverseGeocode();
    console.log("");
    console.log("🎉 모든 VWorld 테스트 완료!");
  } catch (error) {
    console.error("❌ 테스트 실행 중 오류:", error);
  }
}

if (typeof window !== "undefined" && import.meta.env.DEV) {
  console.log("🌍 VWorld 역지오코딩 수동 테스트가 로드되었습니다!");
  console.log("브라우저 콘솔에서 다음 함수들을 사용할 수 있습니다:");
  console.log("🔗 testVWorldConnection()");
  console.log("🗺️  testReverseGeocode(lat?, lon?)");
  console.log("🚀 runAllVWorldTests()");

  (window as any).testVWorldConnection = testVWorldConnection;
  (window as any).testReverseGeocode = testReverseGeocode;
  (window as any).runAllVWorldTests = runAllVWorldTests;
}
