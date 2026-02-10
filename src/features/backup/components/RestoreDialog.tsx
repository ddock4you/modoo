import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useStorage } from "@/lib/storage/useStorage";
import { useMedia } from "@/lib/media/useMedia";
import { IndexedDbBackupService } from "@/lib/backup";
import type {
  RestoreProgress,
  RestoreResult,
  RestoreOptions,
  BackupMetadata,
} from "@/lib/backup";

interface RestoreDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RestoreDialog({ isOpen, onClose }: RestoreDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<RestoreProgress | null>(null);
  const [result, setResult] = useState<RestoreResult | null>(null);
  const [previewMetadata, setPreviewMetadata] = useState<BackupMetadata | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storage = useStorage();
  const media = useMedia();

  const validateMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!storage || !media) {
        throw new Error("저장소 서비스를 사용할 수 없습니다");
      }

      const backupService = new IndexedDbBackupService(storage, media);
      return backupService.validateBackup(file);
    },
    onSuccess: (validation) => {
      if (validation.valid && validation.metadata) {
        setPreviewMetadata(validation.metadata);
      }
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async ({ file, options }: { file: File; options: RestoreOptions }) => {
      if (!storage || !media) {
        throw new Error("저장소 서비스를 사용할 수 없습니다");
      }

      const backupService = new IndexedDbBackupService(storage, media);
      return backupService.restoreBackup(file, options, setProgress);
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewMetadata(null);
    setResult(null);
    setProgress(null);

    // 파일 검증
    validateMutation.mutate(file);
  };

  const handleRestore = () => {
    if (!selectedFile) return;

    // 기존 데이터 손실 경고
    const confirmed = window.confirm(
      "⚠️ 경고: 복원 작업으로 기존의 모든 데이터가 삭제되고 백업 파일의 데이터로 교체됩니다.\n\n" +
        "• 기존 식물, 작업 기록, 사진 데이터가 모두 삭제됩니다.\n" +
        "• 삭제된 데이터는 복구할 수 없습니다.\n\n" +
        "정말로 복원을 진행하시겠습니까?"
    );

    if (!confirmed) return;

    setProgress(null);
    setResult(null);
    restoreMutation.mutate({
      file: selectedFile,
      options: { mode: "overwrite" }, // 항상 덮어쓰기 모드로 설정
    });
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewMetadata(null);
    setProgress(null);
    setResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">데이터 복원</h2>

          {!selectedFile && !progress && !result && (
            <>
              <p className="text-gray-600 mb-4">
                백업 파일을 선택하여 데이터를 복원합니다. 복원 전에 현재 데이터를 확인하세요.
              </p>

              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-green-400 transition-colors"
                >
                  <svg
                    className="w-8 h-8 text-gray-400 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-gray-600">백업 파일 선택</p>
                  <p className="text-sm text-gray-500">.json 또는 .zip 파일</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
              </div>
            </>
          )}

          {selectedFile && !progress && !result && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              {validateMutation.isPending && (
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  <span>파일 검증 중...</span>
                </div>
              )}

              {previewMetadata && selectedFile && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">백업 파일 정보</h3>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>생성일: {new Date(previewMetadata.created).toLocaleString()}</p>
                    <p>앱 버전: {previewMetadata.appVersion}</p>
                    <p>파일 크기: {(selectedFile.size / 1024).toFixed(1)} KB</p>
                    <div className="mt-2 pt-2 border-t border-blue-200 space-y-1">
                      <div className="flex justify-between">
                        <span>식물:</span>
                        <span className="font-medium">{previewMetadata.totalPlants}개</span>
                      </div>
                      <div className="flex justify-between">
                        <span>사진:</span>
                        <span className="font-medium">{previewMetadata.totalPhotos}개</span>
                      </div>
                      <div className="flex justify-between">
                        <span>작업 규칙:</span>
                        <span className="font-medium">{previewMetadata.totalTaskRules}개</span>
                      </div>
                      <div className="flex justify-between">
                        <span>작업 기록:</span>
                        <span className="font-medium">{previewMetadata.totalTaskEvents}개</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {validateMutation.isError && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <span className="font-medium text-red-800">유효하지 않은 백업 파일</span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">
                    {validateMutation.error instanceof Error
                      ? validateMutation.error.message
                      : "파일 검증 실패"}
                  </p>
                </div>
              )}

              {previewMetadata && (
                <div className="flex space-x-3">
                  <button
                    onClick={handleRestore}
                    disabled={restoreMutation.isPending}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    복원 시작
                  </button>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    다른 파일
                  </button>
                </div>
              )}
            </div>
          )}

          {progress && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-sm font-medium">{progress.message}</span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                ></div>
              </div>

              {progress.currentItem && (
                <p className="text-xs text-gray-500">현재 처리: {progress.currentItem}</p>
              )}
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {result.success ? (
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-6 h-6 text-blue-600"
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
                  <h3 className="text-lg font-medium text-blue-800 mb-2">복원 완료!</h3>
                  {result.restoredItems && (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>식물: {result.restoredItems.plants}개</p>
                      <p>사진: {result.restoredItems.photos}개</p>
                      <p>작업 규칙: {result.restoredItems.taskRules}개</p>
                      <p>작업 기록: {result.restoredItems.taskEvents}개</p>
                    </div>
                  )}
                  <p className="text-xs text-green-600 mt-2">
                    앱을 새로고침하여 변경사항을 확인하세요.
                  </p>
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
                  <h3 className="text-lg font-medium text-red-800 mb-2">복원 실패</h3>
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
