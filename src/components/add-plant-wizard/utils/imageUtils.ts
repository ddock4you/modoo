// 이미지 관련 유틸리티 함수들

/**
 * 파일의 실제 이미지 크기를 검증하여 반환
 * @param file 이미지 파일
 * @returns 이미지의 너비와 높이
 * @throws 이미지 로드 실패 시 에러
 */
export async function getImageSize(file: File): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    const size = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = (err) => reject(err);
      img.src = url;
    });
    return size;
  } finally {
    URL.revokeObjectURL(url);
  }
}
