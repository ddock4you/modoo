import proj4 from "proj4";

/**
 * 좌표 변환 유틸리티
 * 위경도 ↔ TM 좌표(UTMK, EPSG:5181) 변환
 *
 * AirKorea API에서 TM 좌표를 사용하여 측정소 검색
 */

// 좌표계 정의
const EPSG4326 = "+proj=longlat +datum=WGS84 +no_defs"; // WGS84 (위경도)
const EPSG5181 =
  "+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +units=m +no_defs"; // UTMK

/**
 * 위경도를 TM 좌표(UTMK, EPSG:5181)로 변환
 */
export function latLonToTM(lat: number, lon: number): { tmX: number; tmY: number } {
  const [x, y] = proj4(EPSG4326, EPSG5181, [lon, lat]);
  return { tmX: Math.round(x), tmY: Math.round(y) };
}

/**
 * TM 좌표(UTMK, EPSG:5181)를 위경도로 변환
 */
export function tmToLatLon(tmX: number, tmY: number): { lat: number; lon: number } {
  const [lon, lat] = proj4(EPSG5181, EPSG4326, [tmX, tmY]);
  return { lat, lon };
}
