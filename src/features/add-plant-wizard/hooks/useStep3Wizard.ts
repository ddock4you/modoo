import { useEffect, useState } from "react";
import { useAddPlantWizardActions, useAddPlantWizardState } from "@/lib/plants/add-plant-wizard/hooks";
import { getImageSize } from "../utils/imageUtils";

export function useStep3Wizard() {
  const state = useAddPlantWizardState();
  const { setStep3 } = useAddPlantWizardActions();
  const [files, setFiles] = useState<File[]>(state.step3.files);
  const [coverIndex, setCoverIndex] = useState<number | null>(state.step3.coverIndex);

  useEffect(() => {
    if (state.isOpen) return;
    setFiles(state.step3.files);
    setCoverIndex(state.step3.coverIndex);
  }, [state.isOpen, state.step3.coverIndex, state.step3.files]);

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList) return;

    const next: File[] = [...files];

    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith("image/")) continue;

      try {
        const { width, height } = await getImageSize(file);
        if (width < 350 && height < 350) {
          alert("350픽셀 이상의 이미지만 등록할 수 있어요.");
          continue;
        }
        next.push(file);
      } catch {
        alert("이미지 정보를 읽을 수 없습니다. 다른 파일을 사용해 주세요.");
      }
    }

    setFiles(next);
    setStep3(() => ({
      files: next,
      coverIndex: next.length === 0 ? null : coverIndex,
    }));
  };

  const handleCoverSelect = (index: number) => {
    setCoverIndex(index);
    setStep3((prev) => ({ ...prev, coverIndex: index }));
  };

  const handleSubmit = () => {
    // 파일 상태는 이미 setStep3를 통해 업데이트됨
    // 추가 처리 로직이 필요하면 여기서 실행
  };

  return {
    files,
    coverIndex,
    handleFilesSelected,
    handleCoverSelect,
    handleSubmit,
  };
}
