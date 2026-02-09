import { DevGuard } from "@/features/debug/components/DevGuard";
import { useDebugDb } from "@/features/debug/hooks/useDebugDb";

export function DebugDb() {
  const {
    pageSize,
    selectedStore,
    primaryKeyField,
    offset,
    storesInfo,
    storesLoading,
    storeRows,
    dataLoading,
    editKey,
    editData,
    isUpdating,
    isDeleting,
    setEditData,
    selectStore,
    prevPage,
    nextPage,
    startEdit,
    cancelEdit,
    saveEdit,
    deleteRow,
  } = useDebugDb();

  return (
    <DevGuard>
      <div className="min-h-screen bg-white text-neutral-900 p-4">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-red-600 mb-2">🛠️ DEV 데이터 브라우저</h1>
          <p className="text-sm text-gray-600 mb-2">
            개발 모드에서만 접근할 수 있습니다. 데이터 조작 시 주의하세요!
          </p>
          <div className="flex gap-4 text-sm">
            <a href="/_debug/icons?dev=1" className="text-blue-600 hover:text-blue-800 underline">
              🎨 아이콘 갤러리 보기
            </a>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">스토어 개요</h2>
          {storesLoading ? (
            <div className="text-center py-4">로딩 중...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {storesInfo.map((store) => (
                <div
                  key={store.name}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedStore === store.name
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                  onClick={() => selectStore(store.name)}
                >
                  <h3 className="font-medium capitalize">{store.name}</h3>
                  <p className="text-sm text-gray-600">레코드: {store.count}개</p>
                  <p className="text-sm text-gray-600">keyPath: {store.keyPath || "(none)"}</p>
                  <p className="text-sm text-gray-600">
                    인덱스: {store.indexes.length > 0 ? store.indexes.join(", ") : "(none)"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold capitalize">{selectedStore} 데이터</h2>
            <div className="flex gap-2">
              <button
                onClick={prevPage}
                disabled={offset === 0}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                이전
              </button>
              <span className="px-3 py-1 text-sm text-gray-600">
                {offset + 1}-{offset + storeRows.length}
              </span>
              <button
                onClick={nextPage}
                disabled={storeRows.length < pageSize}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                다음
              </button>
            </div>
          </div>

          {dataLoading ? (
            <div className="text-center py-8">데이터 로딩 중...</div>
          ) : storeRows.length === 0 ? (
            <div className="text-center py-8 text-gray-500">데이터가 없습니다.</div>
          ) : (
            <div className="space-y-2">
              {storeRows.map((row) => (
                <div key={row.primaryKey} className="border rounded-lg p-4">
                  {editKey === row.primaryKey ? (
                    <div className="space-y-3">
                      <textarea
                        value={editData}
                        onChange={(e) => setEditData(e.target.value)}
                        className="w-full h-48 font-mono text-sm p-3 border rounded"
                        placeholder="JSON 형식으로 데이터를 입력하세요"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            const res = await saveEdit();
                            if (!res.ok) alert(res.error);
                          }}
                          disabled={isUpdating}
                          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                        >
                          저장
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-2 bg-gray-500 text-white rounded"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-gray-600">
                          {primaryKeyField}: {row.primaryKey}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(row)}
                            className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
                          >
                            수정
                          </button>
                          <button
                            onClick={async () => {
                              if (
                                confirm(
                                  "정말로 이 데이터를 삭제하시겠습니까? 이 작업은 취소할 수 없습니다."
                                )
                              ) {
                                await deleteRow(row.primaryKey);
                              }
                            }}
                            disabled={isDeleting}
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                      <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                        {JSON.stringify(row.value, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-2">⚠️ 위험 작업 주의</h3>
          <ul className="text-sm text-red-700 space-y-1">
            <li>• 데이터를 직접 수정/삭제하면 앱의 정상 동작이 깨질 수 있습니다</li>
            <li>• 삭제된 데이터는 복구할 수 없습니다</li>
            <li>• 프로덕션 환경에서는 이 페이지에 접근할 수 없습니다</li>
          </ul>
        </div>
      </div>
    </DevGuard>
  );
}
