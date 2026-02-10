/**
 * Coordinate conversion dev scratch
 */

import { latLonToGrid } from "@/lib/weather/kmaGrid";
import { latLonToTM, tmToLatLon } from "@/lib/weather/coord";

const seoulLat = 37.5665;
const seoulLon = 126.978;

const busanLat = 35.1796;
const busanLon = 129.0756;

console.log("=== KMA DFS grid conversion ===");

console.log("Seoul lat/lon:", seoulLat, seoulLon);
const seoulGrid = latLonToGrid(seoulLat, seoulLon);
console.log("Seoul grid:", seoulGrid);

console.log("\nBusan lat/lon:", busanLat, busanLon);
const busanGrid = latLonToGrid(busanLat, busanLon);
console.log("Busan grid:", busanGrid);

console.log("\n=== AirKorea TM conversion ===");
const seoulTM = latLonToTM(seoulLat, seoulLon);
console.log("Seoul TM:", seoulTM);
const busanTM = latLonToTM(busanLat, busanLon);
console.log("Busan TM:", busanTM);

console.log("\n=== Reverse conversion (TM -> lat/lon) ===");
const back = tmToLatLon(seoulTM.tmX, seoulTM.tmY);
console.log("Back:", back);
