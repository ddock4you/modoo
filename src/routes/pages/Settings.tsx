import { useState } from "react";
import { BackupDialog } from "@/features/backup/components/BackupDialog";
import { RestoreDialog } from "@/features/backup/components/RestoreDialog";
import { Button } from "@/components/ui/button";

export function Settings() {
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  return (
    <div className="bg-background text-foreground p-4">
      <h1 className="text-lg font-semibold mb-2">설정</h1>
      <p className="text-sm text-muted-foreground mb-6">앱 환경 설정을 구성합니다.</p>

      <div className="space-y-6">
        {/* 데이터 관리 섹션 */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h2 className="text-base font-medium mb-3">데이터 관리</h2>
          <p className="text-sm text-muted-foreground mb-4">
            앱 데이터를 백업하거나 복원할 수 있습니다.
          </p>

          <div className="space-y-3">
            <Button
              onClick={() => setShowBackupDialog(true)}
              variant="outline"
              className="w-full justify-between h-auto p-3"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-primary"
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
                </div>
                <div className="text-left">
                  <p className="font-medium">데이터 백업</p>
                  <p className="text-sm text-muted-foreground">현재 데이터를 파일로 저장</p>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>

            <Button
              onClick={() => setShowRestoreDialog(true)}
              variant="outline"
              className="w-full justify-between h-auto p-3"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-secondary/50 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-secondary-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-medium">데이터 복원</p>
                  <p className="text-sm text-muted-foreground">백업 파일에서 데이터 불러오기</p>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          </div>

          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <svg
                className="w-5 h-5 text-destructive mt-0.5"
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
              <div className="text-sm">
                <p className="font-medium text-destructive">주의사항</p>
                <ul className="text-destructive/80 mt-1 space-y-1">
                  <li>• 복원 시 기존 데이터가 삭제될 수 있습니다</li>
                  <li>• 백업 파일은 안전한 곳에 보관하세요</li>
                  <li>• 복원 후 앱을 새로고침해야 변경사항이 적용됩니다</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 앱 정보 섹션 */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h2 className="text-base font-medium mb-3">앱 정보</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>버전: 1.0.0</p>
            <p>저장소: IndexedDB + Blob</p>
            <p>PWA: 지원</p>
          </div>
        </div>
      </div>

      {/* 백업/복원 다이얼로그 */}
      <BackupDialog isOpen={showBackupDialog} onClose={() => setShowBackupDialog(false)} />
      <RestoreDialog isOpen={showRestoreDialog} onClose={() => setShowRestoreDialog(false)} />
    </div>
  );
}
