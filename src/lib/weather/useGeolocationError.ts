/**
 * Geolocation API 에러를 사용자 친화적 메시지로 변환하는 유틸리티 훅
 */

/**
 * 에러 코드 상수
 */
const GEOLOCATION_ERROR_CODES = {
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
} as const;

/**
 * Geolocation 에러를 사용자 친화적 메시지로 변환하는 훅
 */
export function useGeolocationError() {
  /**
   * 에러를 사용자 친화적 메시지로 변환
   */
  const getErrorMessage = (error: unknown): string => {
    if (!error) {
      return "위치를 가져올 수 없습니다.";
    }

    // GeolocationPositionError 처리 (브라우저 표준 타입)
    if (error && typeof error === "object" && "code" in error) {
      const geolocationError = error as
        | GeolocationPositionError
        | { code: number; message: string };

      switch (geolocationError.code) {
        case GEOLOCATION_ERROR_CODES.PERMISSION_DENIED:
          // HTTPS 관련 에러 체크
          if (
            geolocationError.message.includes("secure origins") ||
            geolocationError.message.includes("Only secure origins")
          ) {
            return "HTTPS 연결이 필요합니다. 개발 환경에서는 localhost만 지원됩니다.";
          }
          return "위치 권한이 거부되었습니다.";

        case GEOLOCATION_ERROR_CODES.POSITION_UNAVAILABLE:
          return "위치 정보를 사용할 수 없습니다.";

        case GEOLOCATION_ERROR_CODES.TIMEOUT:
          return "위치 탐색 시간이 초과되었습니다.";

        default:
          return "위치를 가져올 수 없습니다.";
      }
    }

    // 일반 Error 객체 처리
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes("denied") || errorMessage.includes("permission")) {
        return "위치 권한이 거부되었습니다.";
      }

      if (errorMessage.includes("timeout")) {
        return "위치 탐색 시간이 초과되었습니다.";
      }

      if (
        errorMessage.includes("not supported") ||
        errorMessage.includes("geolocation") ||
        errorMessage.includes("not available")
      ) {
        return "이 브라우저는 위치 서비스를 지원하지 않습니다.";
      }

      if (errorMessage.includes("secure origins") || errorMessage.includes("only secure origins")) {
        return "HTTPS 연결이 필요합니다. 개발 환경에서는 localhost만 지원됩니다.";
      }

      return error.message || "위치를 가져올 수 없습니다.";
    }

    // 알 수 없는 에러 타입
    return "위치를 가져올 수 없습니다.";
  };

  return {
    getErrorMessage,
  };
}
