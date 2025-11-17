import { vi } from "vitest";
import "@testing-library/jest-dom";

// Mock fetch globally
global.fetch = vi.fn().mockImplementation((url: string) => {
  // VWorld API 모킹
  if (url.includes("api.vworld.kr")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          response: {
            status: "OK",
            result: {
              items: [
                {
                  title: "서울특별시 중구 명동",
                  address: {
                    parcel: "서울특별시 중구 명동",
                    road: "서울특별시 중구 명동길",
                  },
                },
              ],
            },
          },
        }),
    });
  }

  // KMA API 모킹
  if (url.includes("apis.data.go.kr")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          response: {
            header: { resultCode: "00", resultMsg: "NORMAL_SERVICE" },
            body: {
              dataType: "JSON",
              items: {
                item: [
                  {
                    baseDate: "20240101",
                    baseTime: "0600",
                    category: "T1H",
                    fcstDate: "20240101",
                    fcstTime: "0600",
                    fcstValue: "25",
                    nx: 60,
                    ny: 127,
                  },
                ],
              },
            },
          },
        }),
    });
  }

  // AirKorea API 모킹
  if (url.includes("openapi.airkorea.or.kr")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          response: {
            header: { resultCode: "00", resultMsg: "NORMAL_CODE" },
            body: {
              items: [
                {
                  stationName: "서울",
                  dataTime: "2024-01-01 06:00",
                  pm10Value: "35",
                  pm25Value: "20",
                  so2Value: "0.003",
                  coValue: "0.4",
                  o3Value: "0.025",
                  no2Value: "0.015",
                },
              ],
            },
          },
        }),
    });
  }

  // 기본 응답
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  });
});

// Mock import.meta.env
vi.mock("import.meta.env", () => ({
  VITE_AIRKOREA_SERVICE_KEY: "test-api-key",
  VITE_KMA_SERVICE_KEY: "test-kma-key",
  DEV: true,
}));

// Mock navigator.geolocation
Object.defineProperty(navigator, "geolocation", {
  value: {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
  },
  writable: true,
});

// Mock navigator.permissions
Object.defineProperty(navigator, "permissions", {
  value: {
    query: vi.fn().mockImplementation(() => ({
      state: "prompt",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  },
  writable: true,
});

// Mock indexedDB
import "fake-indexeddb/auto";

// Mock onLine property
Object.defineProperty(navigator, "onLine", {
  value: true,
  writable: true,
});
