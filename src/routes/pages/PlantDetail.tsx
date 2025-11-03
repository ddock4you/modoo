import { useParams } from "react-router-dom";

export function PlantDetail() {
  const { id } = useParams();
  return (
    <div className="min-h-screen bg-white text-neutral-900 p-4">
      <h1 className="text-lg font-semibold mb-2">Plant Detail</h1>
      <p className="text-sm text-neutral-600">id: {id}</p>
    </div>
  );
}
