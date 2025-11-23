import { Sun, WaterDrop3 } from "./icons";
import type { Plant } from "../domain/types";

interface PlantStatsProps {
  humidity: Plant["humidity"];
  temperature: Plant["temperature"];
}

const formatRange = (range: { min: number; max: number } | null, unit: string) => {
  if (!range) {
    return "기준 없음";
  }

  if (range.min === range.max) {
    return `${range.min}${unit}`;
  }

  return `${range.min}~${range.max}${unit}`;
};

export default function PlantStats({ humidity, temperature }: PlantStatsProps) {
  const stats = [
    {
      icon: WaterDrop3,
      label: "습도",
      value: humidity,
      unit: "%",
    },
    {
      icon: Sun,
      label: "온도",
      value: temperature,
      unit: "℃",
    },
  ];

  return (
    <div className="flex flex-col gap-2 text-sm font-semibold ">
      {stats.map(({ icon: Icon, label, value, unit }) => (
        <div key={label} className="flex items-center gap-2">
          <p className="flex items-center gap-1">
            <Icon size={16} />
            <span className="text-[#4e4946]">{label}</span>
          </p>
          <span className="text-[#76716F]">{formatRange(value, unit)}</span>
        </div>
      ))}
    </div>
  );
}
