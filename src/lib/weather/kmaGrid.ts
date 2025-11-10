/**
 * 기상청 DFS 격자 변환 유틸리티
 * 위경도 ↔ DFS 격자(nx,ny) 변환
 *
 * 참고: 기상청에서 제공하는 DFS 격자 변환 공식
 * 격자 간격: 5km
 * 기준점: 서울 기준
 */

// 기상청 DFS 변환 상수들
const RE = 6371.00877; // Earth radius (km)
const GRID = 5.0; // Grid spacing (km)
const SLAT1 = 30.0; // Projection latitude 1
const SLAT2 = 60.0; // Projection latitude 2
const OLON = 126.0; // Reference longitude
const OLAT = 38.0; // Reference latitude
const XO = 43; // Origin x index
const YO = 136; // Origin y index

/**
 * 위경도를 DFS 격자(nx, ny)로 변환
 */
export function latLonToGrid(lat: number, lon: number): { nx: number; ny: number } {
  const DEGRAD = Math.PI / 180.0;

  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);

  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;

  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);

  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  const x = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  const y = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

  return { nx: x, ny: y };
}

/**
 * DFS 격자(nx, ny)를 위경도로 변환 (필요시 구현)
 */
export function gridToLatLon(nx: number, ny: number): { lat: number; lon: number } {
  // 역변환은 필요시 구현
  throw new Error("gridToLatLon is not implemented yet");
}
