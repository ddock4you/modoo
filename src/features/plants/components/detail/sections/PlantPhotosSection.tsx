import type { PhotoMeta } from "@/domain/types";
import { PhotoThumbnail } from "../ui/PhotoThumbnail";

export function PlantPhotosSection({
  photos,
  isLoading,
  error,
  coverPhotoId,
  uploadProgress,
  isUploading,
  onUpload,
  isSettingCover,
  settingCoverId,
  onSetCover,
  isDeleting,
  onDelete,
}: {
  photos: PhotoMeta[];
  isLoading: boolean;
  error: unknown;
  coverPhotoId: string;
  uploadProgress: number;
  isUploading: boolean;
  onUpload: (file: File) => void;
  isSettingCover: boolean;
  settingCoverId: string | null;
  onSetCover: (photo: PhotoMeta) => void;
  isDeleting: boolean;
  onDelete: (photo: PhotoMeta) => void;
}) {
  return (
    <section className="mb-6">
      <h2 className="font-semibold mb-3">사진</h2>

      <div className="mb-4">
        <label className="inline-block">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onUpload(file);
              }
              e.target.value = "";
            }}
            disabled={isUploading}
            aria-label="식물 사진 촬영 또는 갤러리에서 선택"
          />
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              isUploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            role="button"
            aria-label={isUploading ? "사진 압축 및 업로드 진행 중" : "식물 사진 촬영 또는 갤러리에서 선택"}
            aria-disabled={isUploading}
          >
            <span className="text-lg">📷</span>
            <span className="text-sm font-medium">{isUploading ? "압축 및 업로드 중..." : "사진 촬영/선택"}</span>
          </div>
        </label>

        {isUploading && uploadProgress > 0 ? (
          <div className="mt-2 w-full max-w-xs">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <span>압축 진행률</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <div
              className="w-full bg-muted rounded-full h-2"
              role="progressbar"
              aria-valuenow={Math.round(uploadProgress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="사진 압축 진행률"
            >
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
        </div>
      ) : error ? (
        <p className="text-destructive text-sm">사진을 불러오는데 실패했습니다.</p>
      ) : photos.length === 0 ? (
        <p className="text-muted-foreground text-sm">등록된 사진이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative">
              <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                <PhotoThumbnail
                  photo={photo}
                  isCover={photo.id === coverPhotoId}
                  onSetCover={photo.id === coverPhotoId ? undefined : () => onSetCover(photo)}
                  isSettingCover={isSettingCover && settingCoverId === photo.id}
                  onDelete={() => onDelete(photo)}
                  isDeleting={isDeleting}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(photo.createdAt).toLocaleDateString("ko-KR")}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
