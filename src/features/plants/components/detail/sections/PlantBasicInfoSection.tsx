import type { Plant } from "@/domain/types";
import {
  formatDateKo,
  formatHumidityRange,
  formatLightLevel,
  formatTemperatureRange,
} from "../utils/formatters";

export function PlantBasicInfoSection({ plant }: { plant: Plant }) {
  return (
    <section className="bg-muted/50 rounded-lg p-4 mb-6">
      <h2 className="font-semibold mb-3">기본 정보</h2>
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">입양일:</span> {formatDateKo(plant.adoptedAt)}
        </div>

        {plant.humidity ? (
          <div>
            <span className="font-medium">습도:</span> {formatHumidityRange(plant.humidity)}
          </div>
        ) : null}

        {plant.temperature ? (
          <div>
            <span className="font-medium">온도:</span> {formatTemperatureRange(plant.temperature)}
          </div>
        ) : null}

        {plant.lightLevel ? (
          <div>
            <span className="font-medium">채광량:</span> {formatLightLevel(plant.lightLevel)}
          </div>
        ) : null}

        {plant.isSensitive ? (
          <div>
            <span className="font-medium text-destructive">주의:</span> 예민한 식물입니다
          </div>
        ) : null}

        {plant.notes ? (
          <div>
            <span className="font-medium">메모:</span> {plant.notes}
          </div>
        ) : null}
      </div>
    </section>
  );
}
