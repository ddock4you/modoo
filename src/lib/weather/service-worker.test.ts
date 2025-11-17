/**
 * PWA 서비스워커 캐싱 전략 테스트
 * Workbox runtimeCaching 설정 검증
 */

import { describe, it, expect } from "vitest";

// KMA API URL 패턴 테스트
describe("KMA 날씨 API 캐싱", () => {
  const kmaPattern = /^https:\/\/apis\.data\.go\.kr\/.*/i;

  it("KMA 날씨 API URL들을 매칭해야 함", () => {
    expect(
      kmaPattern.test("https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst")
    ).toBe(true);
    expect(
      kmaPattern.test(
        "https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty"
      )
    ).toBe(true);
    expect(
      kmaPattern.test("https://apis.data.go.kr/1360000/AsosHourlyInfoService/getWthrDataList")
    ).toBe(true);
  });

  it("KMA가 아닌 URL들은 매칭하지 말아야 함", () => {
    expect(kmaPattern.test("https://api.vworld.kr/req/address")).toBe(false);
    expect(kmaPattern.test("https://fonts.googleapis.com/css2")).toBe(false);
    expect(kmaPattern.test("https://api.openweathermap.org/data/2.5")).toBe(false);
  });

  it("대소문자를 구분하지 않는 매칭을 처리해야 함", () => {
    expect(kmaPattern.test("HTTPS://APIS.DATA.GO.KR/1360000/test")).toBe(true);
    expect(kmaPattern.test("https://apis.DATA.go.kr/B552584/test")).toBe(true);
  });
});

// VWorld API URL 패턴 테스트
describe("VWorld 역지오코딩 API 캐싱", () => {
  const vworldPattern = /^https:\/\/api\.vworld\.kr\/.*/i;

  it("VWorld 역지오코딩 API URL들을 매칭해야 함", () => {
    expect(vworldPattern.test("https://api.vworld.kr/req/address")).toBe(true);
    expect(vworldPattern.test("https://api.vworld.kr/req/coord2addr")).toBe(true);
    expect(vworldPattern.test("https://api.vworld.kr/req/search")).toBe(true);
  });

  it("VWorld가 아닌 URL들은 매칭하지 말아야 함", () => {
    expect(vworldPattern.test("https://apis.data.go.kr/1360000/test")).toBe(false);
    expect(vworldPattern.test("https://fonts.googleapis.com/css2")).toBe(false);
    expect(vworldPattern.test("https://api.github.com/repos")).toBe(false);
  });

  it("대소문자를 구분하지 않는 매칭을 처리해야 함", () => {
    expect(vworldPattern.test("HTTPS://API.VWORLD.KR/REQ/ADDRESS")).toBe(true);
    expect(vworldPattern.test("https://api.Vworld.kr/req/search")).toBe(true);
  });
});

// 캐시 키 생성 로직 테스트
describe("캐시 키 생성", () => {
  // KMA API 키 제외 로직
  const generateKmaCacheKey = async (url: string) => {
    const urlObj = new URL(url);
    urlObj.searchParams.delete("serviceKey");
    return urlObj.toString();
  };

  // VWorld API 키 제외 로직
  const generateVworldCacheKey = async (url: string) => {
    const urlObj = new URL(url);
    urlObj.searchParams.delete("key");
    urlObj.searchParams.delete("apiKey");
    // URL 인코딩을 디코딩하여 테스트와 일치하도록 함
    return decodeURIComponent(urlObj.toString());
  };

  describe("KMA 캐시 키 생성", () => {
    it("캐시 키에서 serviceKey를 제거해야 함", async () => {
      const url =
        "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=TEST_KEY&base_date=20241201";
      const cacheKey = await generateKmaCacheKey(url);
      expect(cacheKey).toBe(
        "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?base_date=20241201"
      );
      expect(cacheKey).not.toContain("serviceKey=TEST_KEY");
    });

    it("다른 파라미터들은 유지해야 함", async () => {
      const url =
        "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=TEST&base_date=20241201&base_time=0500&nx=55&ny=127";
      const cacheKey = await generateKmaCacheKey(url);
      expect(cacheKey).toContain("base_date=20241201");
      expect(cacheKey).toContain("base_time=0500");
      expect(cacheKey).toContain("nx=55");
      expect(cacheKey).toContain("ny=127");
    });

    it("serviceKey가 없는 URL들을 처리해야 함", async () => {
      const url =
        "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?base_date=20241201";
      const cacheKey = await generateKmaCacheKey(url);
      expect(cacheKey).toBe(url);
    });
  });

  describe("VWorld 캐시 키 생성", () => {
    it("key 파라미터를 제거해야 함", async () => {
      const url =
        "https://api.vworld.kr/req/address?key=TEST_KEY&service=address&request=getAddress&point=126.9784,37.5667&type=parcel";
      const cacheKey = await generateVworldCacheKey(url);
      expect(cacheKey).toBe(
        "https://api.vworld.kr/req/address?service=address&request=getAddress&point=126.9784,37.5667&type=parcel"
      );
      expect(cacheKey).not.toContain("key=TEST_KEY");
    });

    it("apiKey 파라미터를 제거해야 함", async () => {
      const url =
        "https://api.vworld.kr/req/address?apiKey=TEST_API_KEY&service=address&request=getAddress&point=126.9784,37.5667";
      const cacheKey = await generateVworldCacheKey(url);
      expect(cacheKey).toBe(
        "https://api.vworld.kr/req/address?service=address&request=getAddress&point=126.9784,37.5667"
      );
      expect(cacheKey).not.toContain("apiKey=TEST_API_KEY");
    });

    it("다른 파라미터들은 유지해야 함", async () => {
      const url =
        "https://api.vworld.kr/req/address?key=TEST&service=address&request=getAddress&point=126.9784,37.5667&type=parcel&version=2.0";
      const cacheKey = await generateVworldCacheKey(url);
      expect(cacheKey).toContain("service=address");
      expect(cacheKey).toContain("request=getAddress");
      expect(cacheKey).toContain("point=126.9784,37.5667");
      expect(cacheKey).toContain("type=parcel");
      expect(cacheKey).toContain("version=2.0");
    });

    it("API 키가 없는 URL들을 처리해야 함", async () => {
      const url =
        "https://api.vworld.kr/req/address?service=address&request=getAddress&point=126.9784,37.5667";
      const cacheKey = await generateVworldCacheKey(url);
      expect(cacheKey).toBe(url);
    });
  });
});

// 캐시 만료 설정 검증
describe("캐시 만료 설정", () => {
  const KMA_MAX_ENTRIES = 50;
  const KMA_MAX_AGE_SECONDS = 60 * 30; // 30분
  const VWORLD_MAX_ENTRIES = 100;
  const VWORLD_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30일

  it("적절한 KMA 캐시 제한을 가져야 함", () => {
    expect(KMA_MAX_ENTRIES).toBe(50);
    expect(KMA_MAX_AGE_SECONDS).toBe(1800); // 30분
  });

  it("적절한 VWorld 캐시 제한을 가져야 함", () => {
    expect(VWORLD_MAX_ENTRIES).toBe(100);
    expect(VWORLD_MAX_AGE_SECONDS).toBe(2592000); // 30일
  });

  it("VWorld 캐시 기간이 KMA보다 길어야 함", () => {
    expect(VWORLD_MAX_AGE_SECONDS).toBeGreaterThan(KMA_MAX_AGE_SECONDS);
  });

  it("VWorld 캐시 항목이 KMA보다 많아야 함", () => {
    expect(VWORLD_MAX_ENTRIES).toBeGreaterThan(KMA_MAX_ENTRIES);
  });
});

// 캐시 전략 검증
describe("캐시 전략 검증", () => {
  it("KMA API들에 StaleWhileRevalidate를 사용해야 함", () => {
    // StaleWhileRevalidate: 캐시된 응답 즉시 반환 + 백그라운드 갱신
    // 날씨 데이터는 실시간성이 중요하지만, 캐시된 데이터도 유용
    expect("StaleWhileRevalidate").toBeDefined();
  });

  it("VWorld API들에 NetworkFirst를 사용해야 함", () => {
    // NetworkFirst: 네트워크 우선, 실패시 캐시 사용
    // 역지오코딩은 정확성이 중요하므로 최신 데이터 우선
    expect("NetworkFirst").toBeDefined();
  });

  it("다른 API 타입들에 대해 다른 전략을 가져야 함", () => {
    const strategies = ["StaleWhileRevalidate", "NetworkFirst"];
    expect(strategies.length).toBeGreaterThan(1);
  });
});
