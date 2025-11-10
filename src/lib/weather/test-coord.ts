/**
 * 좌표 변환 테스트 파일
 * 개발 중에만 사용, 실제 운영에서는 제거
 */

import { latLonToGrid } from "./kmaGrid";
import { latLonToTM, tmToLatLon } from "./coord";

// 서울 좌표 (기상청 기준)
const seoulLat = 37.5665;
const seoulLon = 126.978;

// 부산 좌표 (테스트용)
const busanLat = 35.1796;
const busanLon = 129.0756;

console.log("=== 기상청 DFS 격자 변환 테스트 ===");

// 서울 테스트
console.log("서울 위경도:", seoulLat, seoulLon);
const seoulGrid = latLonToGrid(seoulLat, seoulLon);
console.log("서울 DFS 격자:", seoulGrid);
console.log("예상값: nx≈60, ny≈127");

// 부산 테스트
console.log("\n부산 위경도:", busanLat, busanLon);
const busanGrid = latLonToGrid(busanLat, busanLon);
console.log("부산 DFS 격자:", busanGrid);

console.log("\n=== AirKorea TM 좌표 변환 테스트 ===");

// 서울 TM 변환
const seoulTM = latLonToTM(seoulLat, seoulLon);
console.log("서울 TM 좌표:", seoulTM);
console.log("예상값: tmX≈1000000, tmY≈2000000 근처");

// 부산 TM 변환
const busanTM = latLonToTM(busanLat, busanLon);
console.log("부산 TM 좌표:", busanTM);

// 역변환 테스트 (TM → 위경도)
console.log("\n=== 역변환 테스트 (TM → 위경도) ===");
const { lat: seoulLatBack, lon: seoulLonBack } = tmToLatLon(seoulTM.tmX, seoulTM.tmY);
console.log("서울 TM → 위경도:", { lat: seoulLatBack, lon: seoulLonBack });
console.log("원본:", { lat: seoulLat, lon: seoulLon });
console.log("차이:", {
  lat: Math.abs(seoulLatBack - seoulLat),
  lon: Math.abs(seoulLonBack - seoulLon),
});
