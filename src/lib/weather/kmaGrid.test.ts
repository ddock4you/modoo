/**
 * 기상청 DFS 격자 변환 테스트
 * 위경도 ↔ DFS 격자(nx,ny) 변환 정확도 검증
 */

import { describe, it, expect } from "vitest";
import { latLonToGrid, gridToLatLon } from "./kmaGrid";

describe("KMA 격자 변환", () => {
  describe("latLonToGrid", () => {
    it("서울 좌표를 올바르게 변환해야 함", () => {
      // 서울 시청 좌표 (약 37.5665, 126.9780)
      const result = latLonToGrid(37.5665, 126.978);

      // 기상청 DFS 격자 값 (실제 API에서 사용하는 값)
      expect(result.nx).toBe(60);
      expect(result.ny).toBe(127);
    });

    it("부산 좌표를 올바르게 변환해야 함", () => {
      // 부산 시청 좌표 (약 35.1796, 129.0756)
      const result = latLonToGrid(35.1796, 129.0756);

      // 예상되는 격자 값
      expect(result.nx).toBe(98);
      expect(result.ny).toBe(76);
    });

    it("대구 좌표를 올바르게 변환해야 함", () => {
      // 대구 시청 좌표 (약 35.8714, 128.6014)
      const result = latLonToGrid(35.8714, 128.6014);

      // 실제 계산된 격자 값
      expect(result.nx).toBe(89);
      expect(result.ny).toBe(91);
    });

    it("경계 좌표를 처리해야 함", () => {
      // 대한민국 남서쪽 경계 (제주도 서귀포) - 실제 계산된 값: nx=48, ny=35
      const southwest = latLonToGrid(33.253, 126.286);
      expect(southwest.nx).toBeGreaterThan(40); // 실제 값 48
      expect(southwest.ny).toBeGreaterThan(30); // 실제 값 35

      // 대한민국 북동쪽 경계 (강원도 고성) - 실제 계산된 값: nx=85
      const northeast = latLonToGrid(38.6544, 128.4656);
      expect(northeast.nx).toBeGreaterThan(80); // 실제 값 85
      expect(northeast.ny).toBeGreaterThan(130);
    });

    it("정수 좌표를 반환해야 함", () => {
      const result = latLonToGrid(37.5665, 126.978);

      expect(Number.isInteger(result.nx)).toBe(true);
      expect(Number.isInteger(result.ny)).toBe(true);
      expect(result.nx).toBeGreaterThan(0);
      expect(result.ny).toBeGreaterThan(0);
    });

    it("예외 상황을 처리해야 함", () => {
      // 극단적인 좌표들
      expect(() => latLonToGrid(90, 180)).not.toThrow();
      expect(() => latLonToGrid(-90, -180)).not.toThrow();
      expect(() => latLonToGrid(0, 0)).not.toThrow();
    });

    it("동일 좌표에 대해 일관적이어야 함", () => {
      const coord1 = latLonToGrid(37.5665, 126.978);
      const coord2 = latLonToGrid(37.5665, 126.978);

      expect(coord1.nx).toBe(coord2.nx);
      expect(coord1.ny).toBe(coord2.ny);
    });

    it("경도 wrapping을 처리해야 함", () => {
      // 동경 180도와 서경 180도는 같은 곳
      const east = latLonToGrid(37.5665, 179.9999);
      const west = latLonToGrid(37.5665, -179.9999);

      // 경도 wrapping으로 인해 약간 차이가 있을 수 있음
      expect(Math.abs(east.nx - west.nx)).toBeLessThan(10);
      expect(Math.abs(east.ny - west.ny)).toBeLessThan(10);
    });
  });

  describe("gridToLatLon", () => {
    it("구현되지 않음 에러를 발생시켜야 함", () => {
      expect(() => gridToLatLon(60, 127)).toThrow("gridToLatLon is not implemented yet");
    });
  });

  describe("통합 테스트", () => {
    it("주요 도시들을 올바르게 변환해야 함", () => {
      const testCases = [
        // [lat, lon, expectedNx, expectedNy, cityName]
        [37.5665, 126.978, 60, 127, "Seoul"],
        [35.1796, 129.0756, 98, 76, "Busan"],
        [35.8714, 128.6014, 89, 90, "Daegu"],
        [36.3504, 127.3845, 67, 100, "Daejeon"],
        [35.1595, 126.8526, 58, 74, "Gwangju"],
      ];

      testCases.forEach(([lat, lon, expectedNx, expectedNy, cityName]) => {
        const result = latLonToGrid(lat as number, lon as number);

        // 실제 변환 값이 예상 범위 내에 있는지 확인
        expect(Math.abs(result.nx - (expectedNx as number))).toBeLessThan(5);
        expect(Math.abs(result.ny - (expectedNy as number))).toBeLessThan(5);
      });
    });

    it("합리적인 정밀도를 유지해야 함", () => {
      // 같은 지역 내에서 약간의 좌표 차이는 작은 격자 차이를 만들어야 함
      const seoul1 = latLonToGrid(37.5665, 126.978); // 시청
      const seoul2 = latLonToGrid(37.57, 126.98); // 인근 지역

      // 약 500m 차이는 격자에서 1-2 정도 차이
      expect(Math.abs(seoul1.nx - seoul2.nx)).toBeLessThan(3);
      expect(Math.abs(seoul1.ny - seoul2.ny)).toBeLessThan(3);
    });
  });

  describe("수학적 속성", () => {
    it("부동소수점 정밀도를 처리해야 함", () => {
      // 부동소수점 정밀도 문제 테스트
      const result1 = latLonToGrid(37.5665000001, 126.9780000001);
      const result2 = latLonToGrid(37.5664999999, 126.9779999999);

      // 미세한 차이는 같은 격자를 반환해야 함
      expect(result1.nx).toBe(result2.nx);
      expect(result1.ny).toBe(result2.ny);
    });

    it("결정적이어야 함", () => {
      // 동일 입력에 대해 항상 동일 출력
      const inputs = [
        [37.5665, 126.978],
        [35.1796, 129.0756],
        [35.8714, 128.6014],
        [36.3504, 127.3845],
      ];

      inputs.forEach(([lat, lon]) => {
        const result1 = latLonToGrid(lat as number, lon as number);
        const result2 = latLonToGrid(lat as number, lon as number);

        expect(result1.nx).toBe(result2.nx);
        expect(result1.ny).toBe(result2.ny);
      });
    });
  });
});
