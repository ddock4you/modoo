/**
 * useGeolocationError 단위 테스트
 * 에러 변환 로직 검증
 */

import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useGeolocationError } from "./useGeolocationError";

describe("useGeolocationError", () => {
  it("should return getErrorMessage function", () => {
    const { result } = renderHook(() => useGeolocationError());
    expect(result.current.getErrorMessage).toBeDefined();
    expect(typeof result.current.getErrorMessage).toBe("function");
  });

  describe("getErrorMessage - GeolocationPositionError", () => {
    it("should handle PERMISSION_DENIED (code: 1)", () => {
      const { result } = renderHook(() => useGeolocationError());
      const error = {
        code: 1,
        message: "User denied Geolocation",
      } as GeolocationPositionError;

      const message = result.current.getErrorMessage(error);
      expect(message).toBe("위치 권한이 거부되었습니다.");
    });

    it("should handle PERMISSION_DENIED with secure origins message", () => {
      const { result } = renderHook(() => useGeolocationError());
      const error = {
        code: 1,
        message: "Only secure origins are allowed (see: https://goo.gl/Y0ZkNV).",
      } as GeolocationPositionError;

      const message = result.current.getErrorMessage(error);
      expect(message).toBe("HTTPS 연결이 필요합니다. 개발 환경에서는 localhost만 지원됩니다.");
    });

    it("should handle POSITION_UNAVAILABLE (code: 2)", () => {
      const { result } = renderHook(() => useGeolocationError());
      const error = {
        code: 2,
        message: "Position unavailable",
      } as GeolocationPositionError;

      const message = result.current.getErrorMessage(error);
      expect(message).toBe("위치 정보를 사용할 수 없습니다.");
    });

    it("should handle TIMEOUT (code: 3)", () => {
      const { result } = renderHook(() => useGeolocationError());
      const error = {
        code: 3,
        message: "Timeout",
      } as GeolocationPositionError;

      const message = result.current.getErrorMessage(error);
      expect(message).toBe("위치 탐색 시간이 초과되었습니다.");
    });

    it("should handle unknown error code", () => {
      const { result } = renderHook(() => useGeolocationError());
      const error = {
        code: 999,
        message: "Unknown error",
      } as GeolocationPositionError;

      const message = result.current.getErrorMessage(error);
      expect(message).toBe("위치를 가져올 수 없습니다.");
    });
  });

  describe("getErrorMessage - Error object", () => {
    it("should handle permission denied error", () => {
      const { result } = renderHook(() => useGeolocationError());
      const error = new Error("Permission denied");

      const message = result.current.getErrorMessage(error);
      expect(message).toBe("위치 권한이 거부되었습니다.");
    });

    it("should handle timeout error", () => {
      const { result } = renderHook(() => useGeolocationError());
      const error = new Error("Timeout");

      const message = result.current.getErrorMessage(error);
      expect(message).toBe("위치 탐색 시간이 초과되었습니다.");
    });

    it("should handle not supported error", () => {
      const { result } = renderHook(() => useGeolocationError());
      const error = new Error("Geolocation is not supported");

      const message = result.current.getErrorMessage(error);
      expect(message).toBe("이 브라우저는 위치 서비스를 지원하지 않습니다.");
    });

    it("should handle secure origins error", () => {
      const { result } = renderHook(() => useGeolocationError());
      const error = new Error("Only secure origins are allowed");

      const message = result.current.getErrorMessage(error);
      expect(message).toBe("HTTPS 연결이 필요합니다. 개발 환경에서는 localhost만 지원됩니다.");
    });

    it("should handle generic error with message", () => {
      const { result } = renderHook(() => useGeolocationError());
      const error = new Error("Something went wrong");

      const message = result.current.getErrorMessage(error);
      expect(message).toBe("Something went wrong");
    });

    it("should handle error without message", () => {
      const { result } = renderHook(() => useGeolocationError());
      const error = new Error("");

      const message = result.current.getErrorMessage(error);
      expect(message).toBe("위치를 가져올 수 없습니다.");
    });
  });

  describe("getErrorMessage - Generic error object", () => {
    it("should handle error-like object with code", () => {
      const { result } = renderHook(() => useGeolocationError());
      const error = {
        code: 1,
        message: "Permission denied",
      };

      const message = result.current.getErrorMessage(error);
      expect(message).toBe("위치 권한이 거부되었습니다.");
    });

    it("should handle error-like object with secure origins", () => {
      const { result } = renderHook(() => useGeolocationError());
      const error = {
        code: 1,
        message: "Only secure origins are allowed",
      };

      const message = result.current.getErrorMessage(error);
      expect(message).toBe("HTTPS 연결이 필요합니다. 개발 환경에서는 localhost만 지원됩니다.");
    });
  });

  describe("getErrorMessage - Edge cases", () => {
    it("should handle null", () => {
      const { result } = renderHook(() => useGeolocationError());
      const message = result.current.getErrorMessage(null);
      expect(message).toBe("위치를 가져올 수 없습니다.");
    });

    it("should handle undefined", () => {
      const { result } = renderHook(() => useGeolocationError());
      const message = result.current.getErrorMessage(undefined);
      expect(message).toBe("위치를 가져올 수 없습니다.");
    });

    it("should handle empty object", () => {
      const { result } = renderHook(() => useGeolocationError());
      const message = result.current.getErrorMessage({});
      expect(message).toBe("위치를 가져올 수 없습니다.");
    });

    it("should handle string", () => {
      const { result } = renderHook(() => useGeolocationError());
      const message = result.current.getErrorMessage("some error");
      expect(message).toBe("위치를 가져올 수 없습니다.");
    });
  });
});
