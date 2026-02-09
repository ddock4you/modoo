import { useParams } from "react-router-dom";
import { PlantDetailView } from "@/features/plants/components/detail/PlantDetailView";

export function PlantDetail() {
  const { id } = useParams();
  return <PlantDetailView plantId={id ?? ""} />;
}
