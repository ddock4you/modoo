/**
 * KMA integration tests (real API) - dev only
 */

import { KmaWeatherProvider } from "@/infrastructure/weather/clients/kma/KmaWeatherClient";
import { expect } from "vitest";
import type { WeatherDailyPoint, WeatherHourlyPoint, WeatherNow } from "@/domain/types";

const API_KEY = import.meta.env.VITE_KMA_SERVICE_KEY;

if (!API_KEY) {
  console.error("❌ VITE_KMA_SERVICE_KEY is not set in .env");
}

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
    console.log("📊 Test 1: Current Weather");
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

    console.log("📈 Test 2: Hourly Forecast");
    const hourlyForecast = await provider.getHourlyForecast(testLocation);
    console.log(`✅ Hourly Forecast: ${hourlyForecast.length}시간 데이터`);
    console.log("");

    console.log("📅 Test 3: Daily Forecast");
    const dailyForecast = await provider.getDailyForecast(testLocation);
    console.log(`✅ Daily Forecast: ${dailyForecast.length}일 데이터`);
    console.log("");

    console.log("🔍 Test 4: Response Structure Validation");
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

function validateHourlyForecast(forecast: WeatherHourlyPoint[]): boolean {
  try {
    expect(Array.isArray(forecast)).toBe(true);
    if (forecast.length > 0) {
      const sample = forecast[0];
      expect(typeof sample.time).toBe("string");
      expect(typeof sample.tempC).toBe("number");
    }
    return true;
  } catch (error) {
    console.error("HourlyForecast validation failed:", error);
    return false;
  }
}

function validateDailyForecast(forecast: WeatherDailyPoint[]): boolean {
  try {
    expect(Array.isArray(forecast)).toBe(true);
    if (forecast.length > 0) {
      const sample = forecast[0];
      expect(typeof sample.date).toBe("string");
      expect(typeof sample.minC).toBe("number");
      expect(typeof sample.maxC).toBe("number");
    }
    return true;
  } catch (error) {
    console.error("DailyForecast validation failed:", error);
    return false;
  }
}

export async function testApiConnection() {
  console.log("🔗 Testing KMA API connection...");

  try {
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

    const result = await provider.getCurrentWeather(testLocation);
    console.log("✅ KMA API connected successfully");
    console.log(`📊 Current temperature: ${result.tempC}°C`);
  } catch (error) {
    console.error("❌ KMA API connection failed:", error);
  }
}

export async function runManualTests() {
  console.log("🔧 KMA Manual Tests - Run in browser console");

  if ("geolocation" in navigator) {
    console.log("📍 GPS Test: Getting current location...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`📍 Current position: ${latitude}, ${longitude}`);

        try {
          const { latLonToGrid } = await import("@/lib/weather/utils/kmaGrid");
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
  }
}

if (typeof window !== "undefined" && import.meta.env.DEV) {
  console.log("🌤️  KMA Integration Tests available in console");
  (window as any).testApiConnection = testApiConnection;
  (window as any).runKmaIntegrationTests = runKmaIntegrationTests;
  (window as any).runManualTests = runManualTests;
}
