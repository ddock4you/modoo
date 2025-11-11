/**
 * VWorld 역지오코딩 수동 테스트
 * 브라우저 콘솔에서 실제 API 호출을 통한 검증
 */

import { VWorldGeocodingProvider } from "./VWorldGeocodingProvider";

// 실제 API 키는 .env에서 가져옴
const API_KEY = import.meta.env.VITE_VWORLD_API_KEY;

if (!API_KEY) {
  console.error("❌ VITE_VWORLD_API_KEY is not set in .env");
}

/**
 * VWorld API 연결 상태 테스트
 */
export async function testVWorldConnection() {
  console.log("🔗 VWorld API 연결 상태 테스트...");

  try {
    const provider = new VWorldGeocodingProvider(API_KEY);

    // 서울 시청 좌표로 테스트
    const testCoords = { lat: 37.5665, lon: 126.978 };
    const result = await provider.reverseGeocode(testCoords.lat, testCoords.lon);

    console.log("✅ VWorld API 연결 성공");
    console.log(`📍 테스트 좌표: ${testCoords.lat}, ${testCoords.lon}`);
    console.log(`🏠 변환된 주소: ${result}`);
  } catch (error) {
    console.error("❌ VWorld API 연결 실패:", error);
  }
}

/**
 * 역지오코딩 테스트
 */
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

/**
 * 여러 좌표 테스트
 */
export async function testMultipleCoordinates() {
  console.log("🗺️  여러 좌표 역지오코딩 테스트...");

  const testCoordinates = [
    { lat: 37.5665, lon: 126.978, name: "서울 시청" },
    { lat: 35.1796, lon: 129.0756, name: "부산 시청" },
    { lat: 35.8714, lon: 128.6014, name: "대구 시청" },
    { lat: 36.3504, lon: 127.3845, name: "대전 시청" },
    { lat: 35.1595, lon: 126.8526, name: "광주 시청" },
    { lat: 33.5094, lon: 126.5215, name: "제주 시청" },
  ];

  const provider = new VWorldGeocodingProvider(API_KEY);

  for (const coord of testCoordinates) {
    try {
      console.log(`\n🏙️  ${coord.name} (${coord.lat}, ${coord.lon})`);
      const result = await provider.reverseGeocode(coord.lat, coord.lon);
      console.log(`✅ ${result}`);
    } catch (error) {
      console.error(`❌ ${coord.name} 실패:`, error);
    }

    // API 호출 간격 조절
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

/**
 * 에러 처리 테스트
 */
export async function testErrorHandling() {
  console.log("🚨 VWorld 에러 처리 테스트...");

  const provider = new VWorldGeocodingProvider(API_KEY);

  // 잘못된 좌표 테스트
  try {
    console.log("📍 잘못된 좌표 테스트 (극지방)...");
    const result = await provider.reverseGeocode(85.0, 0.0);
    console.log(`✅ 결과: ${result}`);
  } catch (error) {
    console.error("❌ 잘못된 좌표 테스트 실패:", error);
  }

  // 잘못된 API 키로 테스트 (실제로는 API 키가 맞으므로 네트워크 에러로 테스트)
  try {
    console.log("🔑 잘못된 API 키 시뮬레이션...");
    const badProvider = new VWorldGeocodingProvider("invalid-key");
    const result = await badProvider.reverseGeocode(37.5665, 126.978);
    console.log(`✅ 폴백 결과: ${result}`);
  } catch (error) {
    console.error("❌ API 키 테스트 실패:", error);
  }
}

/**
 * 우선순위 파싱 테스트
 */
export async function testParsingPriority() {
  console.log("🎯 주소 파싱 우선순위 테스트...");

  const provider = new VWorldGeocodingProvider(API_KEY);

  // 도로명 주소가 잘 나오는 지역 테스트
  const testCoords = [
    { lat: 37.57, lon: 126.98, name: "서울 광화문 인근" },
    { lat: 35.18, lon: 129.08, name: "부산 시청 인근" },
  ];

  for (const coord of testCoords) {
    try {
      console.log(`\n📍 ${coord.name} (${coord.lat}, ${coord.lon})`);
      const result = await provider.reverseGeocode(coord.lat, coord.lon);
      console.log(`✅ 주소: ${result}`);

      // 주소 타입 판별
      if (result.includes("로 ") || result.includes("길 ") || result.includes("대로")) {
        console.log("🏠 주소 타입: 도로명 주소");
      } else if (result.includes("가 ") || result.includes("리 ") || result.includes("동")) {
        console.log("🏠 주소 타입: 지번 주소 또는 법정동");
      } else {
        console.log("🏠 주소 타입: 기타");
      }
    } catch (error) {
      console.error(`❌ ${coord.name} 테스트 실패:`, error);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

/**
 * GPS 기반 실시간 테스트
 */
export async function testGPSGeocoding() {
  console.log("📍 GPS 기반 실시간 역지오코딩 테스트...");

  if (!navigator.geolocation) {
    console.error("❌ Geolocation API를 지원하지 않는 브라우저입니다.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;

      console.log(`📍 현재 위치: ${latitude}, ${longitude}`);

      try {
        const provider = new VWorldGeocodingProvider(API_KEY);
        const result = await provider.reverseGeocode(latitude, longitude);

        console.log("✅ GPS 기반 역지오코딩 성공");
        console.log(`🏠 현재 위치 주소: ${result}`);
      } catch (error) {
        console.error("❌ GPS 기반 역지오코딩 실패:", error);
      }
    },
    (error) => {
      console.error("❌ GPS 위치 정보 획득 실패:", error);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5분
    }
  );
}

/**
 * 모든 VWorld 테스트 실행
 */
export async function runAllVWorldTests() {
  console.log("🚀 VWorld 역지오코딩 전체 테스트 시작\n");

  try {
    await testVWorldConnection();
    console.log("");

    await testReverseGeocode();
    console.log("");

    await testParsingPriority();
    console.log("");

    await testErrorHandling();
    console.log("");

    console.log("🎉 모든 VWorld 테스트 완료!");
  } catch (error) {
    console.error("❌ 테스트 실행 중 오류:", error);
  }
}

/**
 * API 직접 호출 테스트 (디버깅용)
 */
export async function testDirectApiCall(lat: number = 37.5665, lon: number = 126.978) {
  console.log(`🔍 VWorld API 직접 호출 테스트 - 좌표: ${lat}, ${lon}`);

  const params = new URLSearchParams({
    service: "address",
    request: "GetAddress",
    version: "2.0",
    crs: "EPSG:4326",
    point: `${lon},${lat}`,
    format: "json",
    type: "both",
    key: API_KEY,
  });

  // 개발 환경에서는 프록시 사용
  const baseUrl = import.meta.env.DEV
    ? "/api/vworld/req/address"
    : "https://api.vworld.kr/req/address";
  const url = `${baseUrl}?${params.toString()}`;

  try {
    console.log(`📡 API URL: ${url}`);

    const response = await fetch(url);
    const data = await response.json();

    console.log("📋 API 응답:");
    console.log(JSON.stringify(data, null, 2));

    if (data.response?.status === "OK" && data.response?.result?.[0]) {
      const result = data.response.result[0];
      console.log("\n🔍 파싱 결과:");
      console.log("도로명 주소:", result.address?.road || "없음");
      console.log("지번 주소:", result.address?.parcel || "없음");
      console.log("법정동:", result.structure?.text || "없음");
    }
  } catch (error) {
    console.error("❌ API 직접 호출 실패:", error);
  }
}

// 브라우저 환경에서 자동 실행 (개발용)
if (typeof window !== "undefined" && import.meta.env.DEV) {
  console.log("🌍 VWorld 역지오코딩 수동 테스트가 로드되었습니다!");
  console.log("브라우저 콘솔에서 다음 함수들을 사용할 수 있습니다:");
  console.log("");
  console.log("🔗 testVWorldConnection() - API 연결 상태 확인");
  console.log("🗺️  testReverseGeocode(lat?, lon?) - 역지오코딩 테스트");
  console.log("🏙️  testMultipleCoordinates() - 여러 도시 테스트");
  console.log("🚨 testErrorHandling() - 에러 처리 테스트");
  console.log("🎯 testParsingPriority() - 주소 파싱 우선순위 테스트");
  console.log("📍 testGPSGeocoding() - GPS 기반 실시간 테스트");
  console.log("🚀 runAllVWorldTests() - 전체 테스트 실행");
  console.log("🔍 testDirectApiCall(lat?, lon?) - API 직접 호출 (디버깅용)");
  console.log("");

  // 전역 함수로 등록
  (window as any).testVWorldConnection = testVWorldConnection;
  (window as any).testReverseGeocode = testReverseGeocode;
  (window as any).testMultipleCoordinates = testMultipleCoordinates;
  (window as any).testErrorHandling = testErrorHandling;
  (window as any).testParsingPriority = testParsingPriority;
  (window as any).testGPSGeocoding = testGPSGeocoding;
  (window as any).runAllVWorldTests = runAllVWorldTests;
  (window as any).testDirectApiCall = testDirectApiCall;
}
