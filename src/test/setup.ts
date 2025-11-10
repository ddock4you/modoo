import { expect, afterEach, vi } from "vitest";

// Mock fetch globally
global.fetch = vi.fn();

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
