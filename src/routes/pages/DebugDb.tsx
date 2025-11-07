import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDB } from "../../lib/storage/db";

type StoreName = "plants" | "taskRules" | "taskEvents" | "photos" | "settings";

interface StoreInfo {
  name: StoreName;
  count: number;
  indexes: string[];
}

// DEV 전용 가드 컴포넌트
function DevGuard({ children }: { children: React.ReactNode }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isDev = import.meta.env.DEV;
  const hasDevParam = searchParams.get("dev") === "1";

  useEffect(() => {
    if (!isDev || !hasDevParam) {
      navigate("/");
    }
  }, [isDev, hasDevParam, navigate]);

  if (!isDev || !hasDevParam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">접근 거부</h1>
          <p className="text-gray-600">개발 모드에서만 접근할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function DebugDb() {
  // const storage = useStorage(); // 현재 사용하지 않음
  const queryClient = useQueryClient();
  const [selectedStore, setSelectedStore] = useState<StoreName>("plants");
  const [offset, setOffset] = useState(0);
  const [limit] = useState(10);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editData, setEditData] = useState<string>("");

  // 스토어 정보 조회
  const { data: storesInfo = [], isLoading: storesLoading } = useQuery({
    queryKey: ["debug-stores-info"],
    queryFn: async (): Promise<StoreInfo[]> => {
      const db = getDB();
      if (!db) throw new Error("Database not initialized");

      const stores: StoreInfo[] = [];

      for (const storeName of [
        "plants",
        "taskRules",
        "taskEvents",
        "photos",
        "settings",
      ] as StoreName[]) {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const count = await store.count();

        // 인덱스 정보 수집
        const indexes: string[] = [];
        if (storeName === "plants") indexes.push("byName", "byAdoptedAt");
        else if (storeName === "taskRules")
          indexes.push(
            "byPlantId",
            "byType",
            "byNextDueAt",
            "byActiveAndNextDueAt",
            "byPlantIdTypeActive"
          );
        else if (storeName === "taskEvents")
          indexes.push("byPlantId", "byType", "byDoneAt", "byPlantIdAndDoneAt");
        else if (storeName === "photos") indexes.push("byPlantId", "byCreatedAt");

        stores.push({ name: storeName, count, indexes });
        await tx.done;
      }

      return stores;
    },
  });

  // 선택된 스토어의 데이터 조회
  const { data: storeData = [], isLoading: dataLoading } = useQuery({
    queryKey: ["debug-store-data", selectedStore, offset, limit],
    queryFn: async (): Promise<any[]> => {
      const db = getDB();
      if (!db) throw new Error("Database not initialized");

      const tx = db.transaction(selectedStore, "readonly");
      const store = tx.objectStore(selectedStore);

      // getAll with offset/limit simulation
      const allData = await store.getAll();
      const start = offset;
      const end = offset + limit;

      await tx.done;
      return allData.slice(start, end);
    },
  });

  // 데이터 수정 mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id: _id, data }: { id: string; data: any }) => {
      const db = getDB();
      if (!db) throw new Error("Database not initialized");

      await db.put(selectedStore, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debug-store-data"] });
      setEditMode(null);
      setEditData("");
    },
  });

  // 데이터 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const db = getDB();
      if (!db) throw new Error("Database not initialized");

      await db.delete(selectedStore, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debug-store-data"] });
      queryClient.invalidateQueries({ queryKey: ["debug-stores-info"] });
    },
  });

  const handleEdit = (item: any) => {
    setEditMode(item.id);
    setEditData(JSON.stringify(item, null, 2));
  };

  const handleSave = () => {
    try {
      const parsedData = JSON.parse(editData);
      updateMutation.mutate({ id: editMode!, data: parsedData });
    } catch (error) {
      alert("JSON 형식이 잘못되었습니다.");
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("정말로 이 데이터를 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <DevGuard>
      <div className="min-h-screen bg-white text-neutral-900 p-4">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-red-600 mb-2">🛠️ DEV 데이터 브라우저</h1>
          <p className="text-sm text-gray-600">
            개발 모드에서만 접근할 수 있습니다. 데이터 조작 시 주의하세요!
          </p>
        </div>

        {/* 스토어 정보 */}
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
                    selectedStore === store.name ? "border-blue-500 bg-blue-50" : "border-gray-200"
                  }`}
                  onClick={() => {
                    setSelectedStore(store.name);
                    setOffset(0);
                  }}
                >
                  <h3 className="font-medium capitalize">{store.name}</h3>
                  <p className="text-sm text-gray-600">레코드: {store.count}개</p>
                  <p className="text-sm text-gray-600">인덱스: {store.indexes.join(", ")}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 데이터 뷰어 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold capitalize">{selectedStore} 데이터</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                이전
              </button>
              <span className="px-3 py-1 text-sm text-gray-600">
                {offset + 1}-{offset + storeData.length}
              </span>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={storeData.length < limit}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                다음
              </button>
            </div>
          </div>

          {dataLoading ? (
            <div className="text-center py-8">데이터 로딩 중...</div>
          ) : storeData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">데이터가 없습니다.</div>
          ) : (
            <div className="space-y-2">
              {storeData.map((item: any) => (
                <div key={item.id} className="border rounded-lg p-4">
                  {editMode === item.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editData}
                        onChange={(e) => setEditData(e.target.value)}
                        className="w-full h-48 font-mono text-sm p-3 border rounded"
                        placeholder="JSON 형식으로 데이터를 입력하세요"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          disabled={updateMutation.isPending}
                          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                        >
                          저장
                        </button>
                        <button
                          onClick={() => setEditMode(null)}
                          className="px-4 py-2 bg-gray-500 text-white rounded"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-gray-600">ID: {item.id}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deleteMutation.isPending}
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                      <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                        {JSON.stringify(item, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 경고 메시지 */}
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
