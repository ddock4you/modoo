import { useQuery } from "@tanstack/react-query";
import { useStorage } from "../../lib/storage/useStorage";
import { Link } from "react-router-dom";
import type { TaskRule, Plant } from "../../domain/types";

interface DueTask {
  plant: Plant;
  rule: TaskRule;
  isOverdue: boolean;
}

export function Dashboard() {
  const storage = useStorage();

  // Due 작업 조회
  const {
    data: dueTasks = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dueTasks"],
    queryFn: async (): Promise<DueTask[]> => {
      const now = Date.now();
      const tasks = await storage.getDueTasks(now);

      // overdue 분류: nextDueAt이 현재 시간보다 이전인 경우
      return tasks.map(({ plant, rule }) => ({
        plant,
        rule,
        isOverdue: rule.nextDueAt < now,
      }));
    },
    refetchInterval: 60000, // 1분마다 갱신
  });

  // due와 overdue로 분리
  const overdueTasks = dueTasks.filter((task) => task.isOverdue);
  const todayTasks = dueTasks.filter((task) => !task.isOverdue);

  const formatTimeRemaining = (nextDueAt: number) => {
    const now = Date.now();
    const diffMs = nextDueAt - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}일 남음`;
    } else if (diffHours > 0) {
      return `${diffHours}시간 남음`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes > 0 ? `${diffMinutes}분 남음` : "지금";
    }
  };

  const formatOverdueTime = (nextDueAt: number) => {
    const now = Date.now();
    const diffMs = now - nextDueAt;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}일 지남`;
    } else if (diffHours > 0) {
      return `${diffHours}시간 지남`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}분 지남`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 p-4">
        <h1 className="text-lg font-semibold mb-2">Dashboard</h1>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">작업 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 p-4">
        <h1 className="text-lg font-semibold mb-2">Dashboard</h1>
        <div className="text-center py-8">
          <p className="text-red-600">작업 목록을 불러오는데 실패했습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 p-4">
      <h1 className="text-lg font-semibold mb-4">Dashboard</h1>

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <div className="mb-6">
          <h2 className="text-md font-semibold text-red-600 mb-3">
            ⚠️ 지연된 작업 ({overdueTasks.length})
          </h2>
          <div className="space-y-2">
            {overdueTasks.map(({ plant, rule }) => (
              <div
                key={`${plant.id}-${rule.id}`}
                className="border border-red-200 rounded-lg p-3 bg-red-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Link
                      to={`/plants/${plant.id}`}
                      className="font-medium text-red-800 hover:underline"
                    >
                      {plant.name}
                    </Link>
                    <div className="text-sm text-red-600 mt-1">
                      {rule.type === "water" ? "💧 물주기" : "🌱 비료주기"} •{" "}
                      {formatOverdueTime(rule.nextDueAt)}
                    </div>
                    {rule.note && <div className="text-xs text-red-500 mt-1">{rule.note}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Tasks */}
      <div className="mb-6">
        <h2 className="text-md font-semibold text-blue-600 mb-3">
          📅 오늘 할 작업 ({todayTasks.length})
        </h2>
        {todayTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>오늘 할 작업이 없습니다.</p>
            <p className="text-sm mt-2">식물을 등록하고 작업 규칙을 설정해보세요!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayTasks.map(({ plant, rule }) => (
              <div
                key={`${plant.id}-${rule.id}`}
                className="border rounded-lg p-3 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Link to={`/plants/${plant.id}`} className="font-medium hover:underline">
                      {plant.name}
                    </Link>
                    <div className="text-sm text-gray-600 mt-1">
                      {rule.type === "water" ? "💧 물주기" : "🌱 비료주기"} •{" "}
                      {formatTimeRemaining(rule.nextDueAt)}
                    </div>
                    {rule.note && <div className="text-xs text-gray-500 mt-1">{rule.note}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="border-t pt-4">
        <h2 className="text-md font-semibold mb-3">빠른 작업</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/plants" className="p-3 border rounded-lg text-center hover:bg-gray-50">
            <div className="text-2xl mb-1">🌱</div>
            <div className="text-sm font-medium">식물 관리</div>
          </Link>
          <Link to="/settings" className="p-3 border rounded-lg text-center hover:bg-gray-50">
            <div className="text-2xl mb-1">⚙️</div>
            <div className="text-sm font-medium">설정</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
