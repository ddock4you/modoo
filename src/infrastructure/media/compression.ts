// 원본 이미지 압축 설정
export const getOriginalCompressionOptions = (onProgress?: (progress: number) => void) =>
  ({
    maxSizeMB: 2, // 최대 2MB
    maxWidthOrHeight: 1920, // 최대 1920px (Full HD)
    useWebWorker: true, // Web Worker 사용으로 성능 향상
    initialQuality: 0.85, // 85% 품질
    fileType: "image/webp", // WebP 포맷 (더 효율적)
    preserveExif: false, // EXIF 메타데이터 제거로 용량 절감
    onProgress, // 진행률 콜백
  } as const);
