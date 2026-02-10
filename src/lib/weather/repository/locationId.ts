import { latLonToGrid } from "@/lib/weather/utils/kmaGrid";

export function generateLocationId(lat: number, lon: number): string {
  const { nx, ny } = latLonToGrid(lat, lon);
  return `grid_${nx}_${ny}`;
}
