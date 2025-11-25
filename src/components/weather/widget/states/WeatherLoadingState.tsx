/**
 * WeatherLoadingState 컴포넌트
 * 날씨 위젯 로딩 상태 UI
 */

import { RefreshCw } from "lucide-react";

export function WeatherLoadingState() {
  return (
    <div className="bg-card text-card-foreground rounded-lg p-4 border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">날씨</h3>
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          <RefreshCw className="h-3 w-3 animate-spin" />
          <span>로딩 중...</span>
        </div>
      </div>
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded mb-2"></div>
        <div className="h-16 bg-muted rounded"></div>
      </div>
    </div>
  );
}
