import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useStorage } from "@/lib/storage/useStorage";
import { useMedia } from "@/lib/media/useMedia";
import { IndexedDBBackupService } from "@/lib/backup";
import type { BackupProgress, BackupResult, BackupOptions } from "@/lib/backup";

interface BackupDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BackupDialog({ isOpen, onClose }: BackupDialogProps) {
  const [includePhotos, setIncludePhotos] = useState(true);
  const [progress, setProgress] = useState<BackupProgress | null>(null);
  const [result, setResult] = useState<BackupResult | null>(null);

  const storage = useStorage();
  const media = useMedia();

  const backupMutation = useMutation({
    mutationFn: async (options: BackupOptions) => {
      if (!storage || !media) {
        throw new Error("저장소 서비스를 사용할 수 없습니다");
      }

      const backupService = new IndexedDBBackupService(storage, media);
      return backupService.createBackup(options, setProgress);
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (error) => {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      });
    },
  });

  const handleBackup = () => {
    setProgress(null);
    setResult(null);
    backupMutation.mutate({ includePhotos });
  };

  const canDownload = Boolean(result?.success && result.blob && result.filename);

  const handleDownload = () => {
    if (!canDownload || !result?.blob || !result.filename) return;

    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const handleClose = () => {
    setProgress(null);
    setResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">데이터 백업</h2>

          {!progress && !result && (
            <>
              <p className="text-gray-600 mb-4">
                현재 앱의 모든 데이터를 백업 파일로 생성합니다. 백업 완료 후 아래의
                다운로드 버튼을 눌러 저장하세요.
              </p>

              <div className="space-y-3 mb-6">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={includePhotos}
                    onChange={(e) => setIncludePhotos(e.target.checked)}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm">
                    사진 데이터 포함
                    {includePhotos && (
                      <span className="text-gray-500 ml-2">(ZIP 파일로 압축됩니다)</span>
                    )}
                  </span>
                </label>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleBackup}
                  disabled={backupMutation.isPending}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  백업 시작
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
              </div>
            </>
          )}

          {progress && !result && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                <span className="text-sm font-medium">{progress.message}</span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                ></div>
              </div>

              {progress.currentItem && (
                <p className="text-xs text-gray-500">현재 처리: {progress.currentItem}</p>
              )}

              <button
                type="button"
                disabled
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg opacity-50 cursor-not-allowed"
                aria-disabled="true"
              >
                백업 파일 다운로드 (완료 후 활성화)
              </button>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {result.success ? (
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-green-800 mb-2">백업 완료!</h3>
                  {result.metadata && (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>파일: {result.filename}</p>
                      <p>
                        크기: {result.size ? `${(result.size / 1024).toFixed(1)} KB` : "알 수 없음"}
                      </p>
                      <p>식물: {result.metadata.totalPlants}개</p>
                      <p>사진: {result.metadata.totalPhotos}개</p>
                      <p>작업 규칙: {result.metadata.totalTaskRules}개</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!canDownload}
                    className="w-full mt-4 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    백업 파일 다운로드
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-6 h-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-red-800 mb-2">백업 실패</h3>
                  <p className="text-sm text-red-600">{result.error}</p>
                </div>
              )}

              <button
                onClick={handleClose}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
              >
                닫기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
