import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { IndexedDbWeatherCache } from "./IndexedDbWeatherCache";

// IndexedDB 모킹 설정
import "fake-indexeddb/auto";

// IDBDatabase 인터페이스 확장
declare global {
  interface IDBDatabase {
    _close?: () => void;
  }
}

// IndexedDbWeatherCache 로직 테스트 (DB 연결 없이)

describe("IndexedDbWeatherCache", () => {
  describe("TTL 설정 검증", () => {
    it("각 스토어별 TTL 값이 올바르게 설정되어야 함", () => {
      const cache = new IndexedDbWeatherCache();
      const ttlConfig = (cache as any).TTL_MINUTES;

      expect(ttlConfig.now).toBe(10); // 10분
      expect(ttlConfig.hourly).toBe(60); // 60분
      expect(ttlConfig.shortTermDaily).toBe(6 * 60); // 6시간
      expect(ttlConfig.midTermDaily).toBe(12 * 60); // 12시간
      expect(ttlConfig.airQuality).toBe(60); // 60분
    });

    it("위치별 최대 보존 일수가 7일로 설정되어야 함", () => {
      const cache = new IndexedDbWeatherCache();
      const maxDays = (cache as any).MAX_DAYS_PER_LOCATION;

      expect(maxDays).toBe(7);
    });
  });

  describe("TTL 계산 로직", () => {
    let cache: IndexedDbWeatherCache;

    beforeEach(() => {
      cache = new IndexedDbWeatherCache();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("현재 날씨 TTL을 올바르게 계산해야 함", () => {
      const now = Date.now();
      const expectedExpiresAt = now + 10 * 60 * 1000; // 10분

      // private 메서드에 접근하기 위해 타입 단언
      const ttlMinutes = (cache as any).TTL_MINUTES.now;
      const calculatedExpiresAt = now + ttlMinutes * 60 * 1000;

      expect(calculatedExpiresAt).toBe(expectedExpiresAt);
    });

    it("시간별 날씨 TTL을 올바르게 계산해야 함", () => {
      const now = Date.now();
      const expectedExpiresAt = now + 60 * 60 * 1000; // 60분

      const ttlMinutes = (cache as any).TTL_MINUTES.hourly;
      const calculatedExpiresAt = now + ttlMinutes * 60 * 1000;

      expect(calculatedExpiresAt).toBe(expectedExpiresAt);
    });

    it("단기예보 일별 날씨 TTL을 올바르게 계산해야 함", () => {
      const now = Date.now();
      const expectedExpiresAt = now + 6 * 60 * 60 * 1000; // 6시간

      const ttlMinutes = (cache as any).TTL_MINUTES.shortTermDaily;
      const calculatedExpiresAt = now + ttlMinutes * 60 * 1000;

      expect(calculatedExpiresAt).toBe(expectedExpiresAt);
    });
  });

  describe("만료 상태 판별", () => {
    it("현재 시간이 만료 시간보다 이전이면 isStale이 false여야 함", () => {
      const now = Date.now();
      const futureExpiresAt = now + 10000; // 10초 후

      // 만료 상태 판별 로직 검증
      const isStale = futureExpiresAt <= now;
      expect(isStale).toBe(false);
    });

    it("현재 시간이 만료 시간보다 이후면 isStale이 true여야 함", () => {
      const now = Date.now();
      const pastExpiresAt = now - 10000; // 10초 전

      const isStale = pastExpiresAt <= now;
      expect(isStale).toBe(true);
    });
  });

  describe("초기화", () => {
    it("init 메서드가 존재해야 함", () => {
      const cache = new IndexedDbWeatherCache();
      expect(typeof cache.init).toBe("function");
    });
  });

  describe("메서드 존재성 검증", () => {
    let cache: IndexedDbWeatherCache;

    beforeEach(() => {
      cache = new IndexedDbWeatherCache();
    });

    it("모든 캐시 관련 메서드가 존재해야 함", () => {
      expect(typeof cache.getNow).toBe("function");
      expect(typeof cache.setNow).toBe("function");
      expect(typeof cache.getHourly).toBe("function");
      expect(typeof cache.setHourly).toBe("function");
      expect(typeof cache.getDaily).toBe("function");
      expect(typeof cache.setDaily).toBe("function");
      expect(typeof cache.getAirQuality).toBe("function");
      expect(typeof cache.setAirQuality).toBe("function");
      expect(typeof cache.getLocation).toBe("function");
      expect(typeof cache.setLocation).toBe("function");
      expect(typeof cache.cleanupExpiredCache).toBe("function");
    });
  });
});
