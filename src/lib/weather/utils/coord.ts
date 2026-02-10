import proj4 from "proj4";

// Coordinate conversion utilities
// WGS84 (lat/lon) <-> UTMK (EPSG:5181)

const EPSG4326 = "+proj=longlat +datum=WGS84 +no_defs";
const EPSG5181 =
  "+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +units=m +no_defs";

export function latLonToTM(lat: number, lon: number): { tmX: number; tmY: number } {
  const [x, y] = proj4(EPSG4326, EPSG5181, [lon, lat]);
  return { tmX: Math.round(x), tmY: Math.round(y) };
}

export function tmToLatLon(tmX: number, tmY: number): { lat: number; lon: number } {
  const [lon, lat] = proj4(EPSG5181, EPSG4326, [tmX, tmY]);
  return { lat, lon };
}
