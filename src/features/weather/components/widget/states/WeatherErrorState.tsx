/**
 * WeatherErrorState 컴포넌트
 * 날씨 위젯 에러 상태 UI
 */

import { WifiOff } from "lucide-react";

export interface WeatherErrorStateProps {
  error?: unknown;
  isOnline: boolean;
}

export function WeatherErrorState({ isOnline }: WeatherErrorStateProps) {
  return (
    <div className="bg-card text-card-foreground rounded-lg p-4 border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">날씨</h3>
        {!isOnline && (
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <WifiOff className="h-3 w-3" />
            <span>오프라인</span>
          </div>
        )}
      </div>
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">날씨 정보를 불러올 수 없습니다.</p>
        {isOnline && (
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-primary hover:underline mt-1"
          >
            다시 시도
          </button>
        )}
      </div>
    </div>
  );
}
