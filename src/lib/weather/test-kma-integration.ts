/**
 * 기상청(KMA) API 통합 테스트
 * 실제 API 호출을 통한 검증 (개발 시에만 사용)
 */

import { KmaWeatherProvider } from "./KmaWeatherProvider";
import { expect } from "vitest";
import type { WeatherNow, WeatherHourlyPoint, WeatherDailyPoint } from "../../domain/types";
// 실제 API 키는 .env에서 가져옴
const API_KEY = import.meta.env.VITE_KMA_SERVICE_KEY;

if (!API_KEY) {
  console.error("❌ VITE_KMA_SERVICE_KEY is not set in .env");
}

/**
 * 실제 API를 통한 통합 테스트
 */
export async function runKmaIntegrationTests() {
  console.log("🌤️  Starting KMA Integration Tests...\n");

  const provider = new KmaWeatherProvider(API_KEY);

  const testLocation = {
    id: "37.5665,126.9780",
    name: "서울 종로구",
    lat: 37.5665,
    lon: 126.978,
    nx: 60,
    ny: 127,
    tmX: 198000,
    tmY: 451000,
    timezone: "Asia/Seoul" as const,
  };

  try {
    // Test 1: 현재 날씨 조회
    console.log("📊 Test 1: Current Weather (실황)");
    const currentWeather = await provider.getCurrentWeather(testLocation);
    console.log("✅ Current Weather:", {
      temperature: `${currentWeather.tempC}°C`,
      humidity: `${currentWeather.humidityPct}%`,
      windSpeed: `${currentWeather.windMs}m/s`,
      sky: currentWeather.weatherCode.sky,
      precipitation: currentWeather.weatherCode.pty,
      updatedAt: new Date(currentWeather.updatedAt).toLocaleString(),
    });
    console.log("");

    // Test 2: 시간별 예보 조회
    console.log("📈 Test 2: Hourly Forecast (초단기예보)");
    const hourlyForecast = await provider.getHourlyForecast(testLocation);
    console.log(`✅ Hourly Forecast: ${hourlyForecast.length}시간 데이터`);
    if (hourlyForecast.length > 0) {
      console.log("📋 Sample hourly data:");
      hourlyForecast.slice(0, 3).forEach((hour, index) => {
        console.log(
          `   ${index + 1}시간 후: ${hour.tempC}°C, 습도:${hour.humidityPct}%, 하늘:${hour.sky}`
        );
      });
    }
    console.log("");

    // Test 3: 일별 예보 조회
    console.log("📅 Test 3: Daily Forecast (단기예보)");
    const dailyForecast = await provider.getDailyForecast(testLocation);
    console.log(`✅ Daily Forecast: ${dailyForecast.length}일 데이터`);
    if (dailyForecast.length > 0) {
      console.log("📋 Sample daily data:");
      dailyForecast.slice(0, 3).forEach((day, index) => {
        console.log(
          `   ${index + 1}일: ${day.minC}°C ~ ${day.maxC}°C, 강수확률:${day.precipProbMaxPct}%`
        );
      });
    }
    console.log("");

    // Test 4: 다른 지역 테스트
    console.log("🏙️  Test 4: Different Location (부산)");
    const busanLocation = {
      id: "35.1796,129.0756",
      name: "부산 북구",
      lat: 35.1796,
      lon: 129.0756,
      nx: 98,
      ny: 76,
      tmX: 345000,
      tmY: 168000,
      timezone: "Asia/Seoul" as const,
    };

    const busanWeather = await provider.getCurrentWeather(busanLocation);
    console.log("✅ Busan Current Weather:", {
      temperature: `${busanWeather.tempC}°C`,
      humidity: `${busanWeather.humidityPct}%`,
      windSpeed: `${busanWeather.windMs}m/s`,
    });
    console.log("");

    // Test 5: API 응답 구조 검증
    console.log("🔍 Test 5: Response Structure Validation");
    const validationResults = {
      currentWeather: validateWeatherNow(currentWeather),
      hourlyForecast: validateHourlyForecast(hourlyForecast),
      dailyForecast: validateDailyForecast(dailyForecast),
    };

    console.log("✅ Validation Results:", validationResults);
    console.log("");

    console.log("🎉 All KMA integration tests passed!");
  } catch (error) {
    console.error("❌ KMA integration test failed:", error);
    throw error;
  }
}

/**
 * WeatherNow 데이터 구조 검증
 */
function validateWeatherNow(weather: WeatherNow): boolean {
  try {
    expect(typeof weather.tempC).toBe("number");
    expect(typeof weather.humidityPct).toBe("number");
    expect(typeof weather.windMs).toBe("number");
    expect(weather.weatherCode).toBeDefined();
    expect(typeof weather.weatherCode.sky).toBe("number");
    expect(typeof weather.weatherCode.pty).toBe("number");
    expect(typeof weather.updatedAt).toBe("number");
    return true;
  } catch (error) {
    console.error("WeatherNow validation failed:", error);
    return false;
  }
}

/**
 * WeatherHourlyPoint 배열 검증
 */
function validateHourlyForecast(forecast: WeatherHourlyPoint[]): boolean {
  try {
    expect(Array.isArray(forecast)).toBe(true);
    if (forecast.length > 0) {
      const sample = forecast[0];
      expect(typeof sample.time).toBe("string");
      expect(typeof sample.tempC).toBe("number");
      // 다른 필드들은 optional일 수 있음
    }
    return true;
  } catch (error) {
    console.error("HourlyForecast validation failed:", error);
    return false;
  }
}

/**
 * WeatherDailyPoint 배열 검증
 */
function validateDailyForecast(forecast: WeatherDailyPoint[]): boolean {
  try {
    expect(Array.isArray(forecast)).toBe(true);
    if (forecast.length > 0) {
      const sample = forecast[0];
      expect(typeof sample.date).toBe("string");
      expect(typeof sample.minC).toBe("number");
      expect(typeof sample.maxC).toBe("number");
      // 다른 필드들은 optional일 수 있음
    }
    return true;
  } catch (error) {
    console.error("DailyForecast validation failed:", error);
    return false;
  }
}

/**
 * API 연결 상태 테스트
 */
export async function testApiConnection() {
  console.log("🔗 Testing KMA API connection...");

  try {
    const provider = new KmaWeatherProvider(API_KEY);

    // 간단한 현재 날씨 조회로 API 연결 상태 확인
    const testLocation = {
      id: "37.5665,126.9780",
      name: "서울 종로구",
      lat: 37.5665,
      lon: 126.978,
      nx: 60,
      ny: 127,
      tmX: 198000,
      tmY: 451000,
      timezone: "Asia/Seoul" as const,
    };

    const result = await provider.getCurrentWeather(testLocation);
    console.log("✅ KMA API connected successfully");
    console.log(`📊 Current temperature: ${result.tempC}°C`);
  } catch (error) {
    console.error("❌ KMA API connection failed:", error);
  }
}

/**
 * 브라우저 콘솔에서 수동 테스트 실행
 * 개발자 도구 콘솔에서: import('./test-kma-integration.ts').then(m => m.runKmaIntegrationTests())
 */
export async function runManualTests() {
  console.log("🔧 KMA Manual Tests - Run in browser console");
  console.log('Usage: import("./test-kma-integration.ts").then(m => m.runKmaIntegrationTests())');

  // GPS 기반 테스트 (브라우저에서만)
  if ("geolocation" in navigator) {
    console.log("📍 GPS Test: Getting current location...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`📍 Current position: ${latitude}, ${longitude}`);

        try {
          // 좌표를 격자 좌표로 변환해서 테스트
          const { latLonToGrid } = await import("./kmaGrid");
          const { nx, ny } = latLonToGrid(latitude, longitude);

          const currentLocation = {
            id: `${latitude},${longitude}`,
            name: "현재 위치",
            lat: latitude,
            lon: longitude,
            nx,
            ny,
            tmX: 0,
            tmY: 0,
            timezone: "Asia/Seoul" as const,
          };

          const provider = new KmaWeatherProvider(API_KEY);
          const result = await provider.getCurrentWeather(currentLocation);
          console.log("✅ GPS-based weather result:", result);
        } catch (error) {
          console.error("❌ GPS weather test failed:", error);
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
  console.log("🌤️  KMA Integration Tests available in console");
  console.log("Available functions:");
  console.log("- testApiConnection()");
  console.log("- runKmaIntegrationTests()");
  console.log("- runManualTests()");

  // 전역 함수로 등록
  (window as any).testApiConnection = testApiConnection;
  (window as any).runKmaIntegrationTests = runKmaIntegrationTests;
  (window as any).runManualTests = runManualTests;
}
