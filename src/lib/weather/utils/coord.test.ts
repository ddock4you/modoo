/**
 * 좌표 변환 유틸리티 테스트
 * 위경도 ↔ TM 좌표(UTMK, EPSG:5181) 변환 정확도 검증
 */

import { describe, it, expect } from "vitest";
import { latLonToTM, tmToLatLon } from "./coord";

describe("좌표 변환", () => {
  describe("latLonToTM", () => {
    it("서울 좌표를 올바르게 변환해야 함", () => {
      // 서울 시청 좌표 (37.5665, 126.9780)
      const result = latLonToTM(37.5665, 126.978);

      // TM 좌표 범위 확인 (서울 지역은 약 950,000-960,000 범위)
      expect(result.tmX).toBeGreaterThan(950000);
      expect(result.tmX).toBeLessThan(960000);
      expect(result.tmY).toBeGreaterThan(1950000);
      expect(result.tmY).toBeLessThan(1960000);

      // 실제 변환 값 (proj4 계산 결과)
      expect(result.tmX).toBe(953901);
      expect(result.tmY).toBe(1952032);
    });

    it("부산 좌표를 올바르게 변환해야 함", () => {
      // 부산 시청 좌표 (35.1796, 129.0756)
      const result = latLonToTM(35.1796, 129.0756);

      // TM 좌표 범위 확인 (부산 지역은 약 1,140,000-1,150,000 범위)
      expect(result.tmX).toBeGreaterThan(1140000);
      expect(result.tmX).toBeLessThan(1150000);
      expect(result.tmY).toBeGreaterThan(1680000);
      expect(result.tmY).toBeLessThan(1690000);

      // 실제 변환 값
      expect(result.tmX).toBe(1143467);
      expect(result.tmY).toBe(1688282);
    });

    it("반올림된 정수 좌표를 반환해야 함", () => {
      const result = latLonToTM(37.5665, 126.978);

      expect(Number.isInteger(result.tmX)).toBe(true);
      expect(Number.isInteger(result.tmY)).toBe(true);
      expect(result.tmX).toBeGreaterThan(0);
      expect(result.tmY).toBeGreaterThan(0);
    });

    it("should handle various Korean cities", () => {
      const testCases = [
        // [lat, lon, cityName]
        [37.5665, 126.978, "Seoul"],
        [35.1796, 129.0756, "Busan"],
        [35.8714, 128.6014, "Daegu"],
        [36.3504, 127.3845, "Daejeon"],
        [35.1595, 126.8526, "Gwangju"],
        [36.4801, 127.289, "Cheongju"],
        [37.4563, 126.7052, "Incheon"],
        [35.5384, 129.3114, "Ulsan"],
      ];

      testCases.forEach(([lat, lon]) => {
        const result = latLonToTM(lat as number, lon as number);

        // TM 좌표는 한국 영역 내에서 적절한 범위여야 함
        expect(result.tmX).toBeGreaterThan(900000);
        expect(result.tmX).toBeLessThan(1200000);
        expect(result.tmY).toBeGreaterThan(1600000);
        expect(result.tmY).toBeLessThan(2100000);
      });
    });

    it("should handle edge coordinates", () => {
      // 대한민국 최북단 (고성)
      const north = latLonToTM(38.6544, 128.4656);
      expect(north.tmX).toBeGreaterThan(200000);
      expect(north.tmY).toBeGreaterThan(500000);

      // 대한민국 최남단 (마라도)
      const south = latLonToTM(33.1107, 126.2761);
      expect(south.tmX).toBeGreaterThan(100000);
      expect(south.tmY).toBeGreaterThan(100000);
    });
  });

  describe("tmToLatLon", () => {
    it("TM 좌표를 다시 위경도로 변환해야 함", () => {
      // 서울 시청 TM 좌표를 다시 위경도로 변환
      const result = tmToLatLon(953901, 1952032);

      // 변환된 좌표가 원래 좌표와 아주 가까워야 함 (매우 높은 정밀도)
      expect(Math.abs(result.lat - 37.5665)).toBeLessThan(0.0001); // 10m 이내
      expect(Math.abs(result.lon - 126.978)).toBeLessThan(0.0001);
    });

    it("부산 좌표를 다시 올바르게 변환해야 함", () => {
      // 부산 시청 TM 좌표를 다시 위경도로 변환
      const result = tmToLatLon(1143467, 1688282);

      // 변환된 좌표가 원래 좌표와 아주 가까워야 함
      expect(Math.abs(result.lat - 35.1796)).toBeLessThan(0.0001);
      expect(Math.abs(result.lon - 129.0756)).toBeLessThan(0.0001);
    });

    it("should maintain precision for round trip conversion", () => {
      const originalLat = 37.5665;
      const originalLon = 126.978;

      // 위경도 → TM → 위경도 변환
      const tm = latLonToTM(originalLat, originalLon);
      const backToLatLon = tmToLatLon(tm.tmX, tm.tmY);

      // 왕복 변환 후에도 오차가 작아야 함
      expect(Math.abs(backToLatLon.lat - originalLat)).toBeLessThan(0.001);
      expect(Math.abs(backToLatLon.lon - originalLon)).toBeLessThan(0.001);
    });
  });

  describe("왕복 변환", () => {
    it("여러 번 변환을 통해 정확도를 유지해야 함", () => {
      const testCoordinates = [
        [37.5665, 126.978, "Seoul"],
        [35.1796, 129.0756, "Busan"],
        [35.8714, 128.6014, "Daegu"],
        [36.3504, 127.3845, "Daejeon"],
        [35.1595, 126.8526, "Gwangju"],
      ];

      testCoordinates.forEach(([lat, lon]) => {
        // 3번 왕복 변환
        let currentLat = lat as number;
        let currentLon = lon as number;

        for (let i = 0; i < 3; i++) {
          const tm = latLonToTM(currentLat, currentLon);
          const back = tmToLatLon(tm.tmX, tm.tmY);
          currentLat = back.lat;
          currentLon = back.lon;
        }

        // 최종 결과가 원본과 큰 차이가 없어야 함
        expect(Math.abs(currentLat - (lat as number))).toBeLessThan(0.01);
        expect(Math.abs(currentLon - (lon as number))).toBeLessThan(0.01);
      });
    });
  });

  describe("수학적 속성", () => {
    it("결정적이어야 함", () => {
      const inputs = [
        [37.5665, 126.978],
        [35.1796, 129.0756],
        [35.8714, 128.6014],
      ];

      inputs.forEach(([lat, lon]) => {
        const result1 = latLonToTM(lat as number, lon as number);
        const result2 = latLonToTM(lat as number, lon as number);

        expect(result1.tmX).toBe(result2.tmX);
        expect(result1.tmY).toBe(result2.tmY);
      });
    });

    it("부동소수점 정밀도를 처리해야 함", () => {
      const result1 = latLonToTM(37.5665000001, 126.9780000001);
      const result2 = latLonToTM(37.5664999999, 126.9779999999);

      // 미세한 차이는 반올림으로 인해 같은 결과가 나올 수 있음
      expect(Math.abs(result1.tmX - result2.tmX)).toBeLessThan(10);
      expect(Math.abs(result1.tmY - result2.tmY)).toBeLessThan(10);
    });

    it("유효한 TM 좌표 범위를 생성해야 함", () => {
      const koreanCities = [
        [37.5665, 126.978, "Seoul"],
        [35.1796, 129.0756, "Busan"],
        [35.8714, 128.6014, "Daegu"],
        [36.3504, 127.3845, "Daejeon"],
        [35.1595, 126.8526, "Gwangju"],
        [36.4801, 127.289, "Cheongju"],
        [37.4563, 126.7052, "Incheon"],
        [35.5384, 129.3114, "Ulsan"],
        [33.5094, 126.5215, "Jeju"],
        [38.2067, 128.5942, "Gangneung"],
      ];

      koreanCities.forEach(([lat, lon, cityName]) => {
        const tm = latLonToTM(lat as number, lon as number);

        // 한국 영역의 TM 좌표 범위 검증 (제주도 제외)
        expect(tm.tmX).toBeGreaterThan(900000); // 최소 X
        expect(tm.tmX).toBeLessThan(1200000); // 최대 X

        // 제주도는 남쪽에 있어서 TM Y 좌표가 작을 수 있음
        if (cityName !== "Jeju") {
          expect(tm.tmY).toBeGreaterThan(1600000); // 최소 Y (제주 제외)
        }
        expect(tm.tmY).toBeLessThan(2100000); // 최대 Y
      });
    });
  });

  describe("AirKorea API 통합", () => {
    it("AirKorea API에서 사용할 유효한 TM 좌표를 생성해야 함", () => {
      // AirKorea API에서 사용하는 대표적인 측정소 좌표들
      const monitoringStations = [
        [37.5665, 126.978, "종로구"],
        [37.5172, 127.0473, "강남구"],
        [35.1796, 129.0756, "부산 북구"],
        [35.8714, 128.6014, "대구 중구"],
      ];

      monitoringStations.forEach(([lat, lon]) => {
        const tm = latLonToTM(lat as number, lon as number);

        // AirKorea API에서 사용하는 TM 좌표 범위 (실제 100만대 좌표)
        expect(tm.tmX).toBeGreaterThan(900000);
        expect(tm.tmX).toBeLessThan(1200000);
        expect(tm.tmY).toBeGreaterThan(1600000);
        expect(tm.tmY).toBeLessThan(2100000);

        // 변환 결과가 정수인지 확인
        expect(Number.isInteger(tm.tmX)).toBe(true);
        expect(Number.isInteger(tm.tmY)).toBe(true);
      });
    });
  });
});
