export function PhotoSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="animate-pulse">
        <div className="w-8 h-8 bg-muted rounded-full" />
      </div>
    </div>
  );
}
