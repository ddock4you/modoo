import { Link } from "react-router-dom";

export function PlantDetailHeader({ plantName }: { plantName: string }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <Link
        to="/plants"
        className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        ← 식물 목록
      </Link>
      <h1 className="text-lg font-semibold">{plantName}</h1>
      <div className="w-16" />
    </div>
  );
}
