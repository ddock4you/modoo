export interface WeatherUpdatedAtBadgeProps {
  updatedAt?: number;
  isOnline: boolean;
}

function formatTime(updatedAt: number): string {
  const d = new Date(updatedAt);
  return d.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WeatherUpdatedAtBadge({ updatedAt, isOnline }: WeatherUpdatedAtBadgeProps) {
  if (!updatedAt) return null;

  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
      업데이트 {formatTime(updatedAt)}
      {!isOnline ? " (오프라인)" : ""}
    </span>
  );
}
