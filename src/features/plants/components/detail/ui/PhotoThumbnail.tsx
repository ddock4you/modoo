import { useMediaThumbnailUrl } from "@/providers/useMediaThumbnailUrl";
import type { PhotoMeta } from "@/domain/types";
import { PhotoSkeleton } from "./PhotoSkeleton";

export function PhotoThumbnail({
  photo,
  onDelete,
  isDeleting,
  isCover,
  onSetCover,
  isSettingCover,
}: {
  photo: PhotoMeta;
  onDelete: () => void;
  isDeleting: boolean;
  isCover: boolean;
  onSetCover?: () => void;
  isSettingCover?: boolean;
}) {
  const { url: imageUrl, isLoading } = useMediaThumbnailUrl(photo.id);

  if (isLoading) {
    return <PhotoSkeleton />;
  }

  if (!imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        <span className="text-xl">❌</span>
      </div>
    );
  }

  return (
    <div className="relative group">
      <img src={imageUrl} alt="식물 사진" className="w-full h-full object-cover" />

      {isCover ? (
        <div className="absolute top-1 left-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow">
          대표
        </div>
      ) : onSetCover ? (
        <button
          type="button"
          onClick={onSetCover}
          disabled={isSettingCover || isDeleting}
          className="absolute top-1 left-1 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-semibold text-foreground shadow backdrop-blur disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={isSettingCover ? "대표 사진 설정 중" : "대표 사진으로 설정"}
        >
          {isSettingCover ? "설정중" : "대표"}
        </button>
      ) : null}

      <button
        type="button"
        onClick={onDelete}
        disabled={isDeleting}
        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={isDeleting ? "사진 삭제 중" : "사진 삭제"}
      >
        {isDeleting ? "…" : "×"}
      </button>
    </div>
  );
}
