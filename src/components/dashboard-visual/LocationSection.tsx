import { Crosshair, Loader2 } from "lucide-react";
import { Button } from "../ui/button";

/**
 * 위치 정보 섹션 컴포넌트
 * 상태: 로딩 중 / 정상 / 에러
 */
export interface LocationSectionProps {
  locationName: string | undefined;
  isLocating: boolean;
  locationError: string | null;
  onSearchLocation: () => void;
}

export function LocationSection({
  locationName,
  isLocating,
  locationError,
  onSearchLocation,
}: LocationSectionProps) {
  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onSearchLocation}
          disabled={isLocating}
          className="shrink-0"
          aria-label="현재 위치 탐색"
        >
          {isLocating ? (
            <Loader2 size={16} color="#76716F" className="animate-spin" />
          ) : (
            <Crosshair size={16} color="#76716F" />
          )}
        </Button>
        <div className="flex-1">
          <span className="text-[#76716F] font-bold">{locationName || "위치 정보 없음"}</span>
        </div>
      </div>
      {/* 에러 상태 표시 */}
      {locationError && <div className="text-xs text-red-600">{locationError}</div>}
    </>
  );
}
