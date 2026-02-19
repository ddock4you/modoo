import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import HintIllustration from "@/assets/illustrations/illust2.png";
import { Info } from "lucide-react";
import { useObjectUrls } from "@/features/add-plant-wizard/hooks/useObjectUrls";

interface Step3PhotosProps {
  files: File[];
  coverIndex: number | null;
  onFilesSelected: (fileList: FileList | null) => void;
  onCoverSelect: (index: number) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function Step3Photos({
  files,
  coverIndex,
  onFilesSelected,
  onCoverSelect,
  onSubmit,
  disabled,
}: Step3PhotosProps) {
  const objectUrls = useObjectUrls(files);

  return (
    <div className="flex flex-col gap-6">
      <div className="px-7 pt-5 pb-9 bg-[#EEF8F5] rounded-b-[20px] flex flex-col gap-5">
        <div className="flex flex-col gap-3 p-6 border rounded-xl bg-white">
          <div className="grid grid-cols-2 gap-3 p-4 rounded-xl border border-dashed">
            <label className="flex flex-col gap-2 aspect-square cursor-pointer items-center justify-center rounded-xl  bg-[#F5F5F5] text-sm text-[#AEAEAE]">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => onFilesSelected(e.target.files)}
              />
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0000004D] text-white">
                +
              </span>
              사진 추가
            </label>
            {files.map((file, index) => {
              const url = objectUrls[index];
              const isCover = coverIndex === index;
              return (
                <button
                  key={`${file.name}-${index}`}
                  type="button"
                  className={cn(
                    "relative aspect-square overflow-hidden rounded-xl border bg-white",
                    isCover ? "border-emerald-500" : "border-neutral-200"
                  )}
                  onClick={() => onCoverSelect(index)}
                >
                  <img
                    src={url}
                    alt="업로드한 사진"
                    className="h-full w-full object-cover"
                  />
                  {isCover && (
                    <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs text-white">
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div>
            <div className="flex items-start gap-1 break-keep">
              <Info className="shrink-0 size-5 text-white" fill="#989593" />
              <p className="text-sm text-[#585452] leading-relaxed">
                대표 사진은 한 장만 등록이 가능합니다.
              </p>
            </div>
            <div className="flex items-start gap-1 break-keep">
              <Info className="shrink-0 size-5 text-white" fill="#989593" />
              <p className="text-sm text-[#585452] leading-relaxed">
                350픽셀 이상의 이미지만 등록 가능합니다.
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            className="h-12 w-full rounded-sm bg-[#00A576] font-bold text-base"
            onClick={onSubmit}
            disabled={disabled}
          >
            {disabled ? "등록 중..." : "화분 등록 최종 완료"}
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-6 rounded-2xl bg-[#EFFBFF] px-7 py-4">
        <img src={HintIllustration} alt="" className="shrink-0" aria-hidden="true" />
        <div className="flex flex-col gap-2">
          <p className="text-lg font-bold text-primary leading-relaxed">
            등록할 사진이 없으신가요?
          </p>
          <p className="text-[#76716F] leading-relaxed text-sm font-medium break-keep">
            사진 없이 호분을 등록할 수 있어요. 화분 등록 후 언제든 추가할 수 있어요.
          </p>
        </div>
      </div>
    </div>
  );
}
