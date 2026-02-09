import type { TaskRule } from "@/domain/types";
import { Button } from "@/components/ui/button";
import { formatNextDueLabel } from "../utils/formatters";

export function PlantTaskRulesSection({
  rules,
  isLoading,
  error,
  nowMs,
  onCompleteRule,
  isCompleting,
}: {
  rules: TaskRule[];
  isLoading: boolean;
  error: unknown;
  nowMs: number;
  onCompleteRule: (rule: TaskRule) => void;
  isCompleting: boolean;
}) {
  return (
    <section className="mb-6">
      <h2 className="font-semibold mb-3">작업 규칙</h2>

      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
        </div>
      ) : error ? (
        <p className="text-destructive text-sm">규칙을 불러오는데 실패했습니다.</p>
      ) : rules.length === 0 ? (
        <p className="text-muted-foreground text-sm">설정된 작업 규칙이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`border rounded-lg p-3 ${
                rule.active === 0
                  ? "border-muted bg-muted/50"
                  : rule.nextDueAt < nowMs
                  ? "border-destructive/20 bg-destructive/5"
                  : "border-primary/20 bg-primary/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{rule.type === "water" ? "💧" : "🌱"}</span>
                    <span className="font-medium">{rule.type === "water" ? "물주기" : "비료주기"}</span>
                    {rule.active === 0 ? (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                        비활성
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {rule.intervalDays}일마다 • 다음: {formatNextDueLabel(rule.nextDueAt, nowMs)}
                  </div>
                  {rule.note ? (
                    <div className="text-xs text-muted-foreground/80 mt-1">{rule.note}</div>
                  ) : null}
                </div>

                {rule.active === 1 ? (
                  <Button
                    type="button"
                    onClick={() => onCompleteRule(rule)}
                    disabled={isCompleting}
                    size="sm"
                  >
                    {isCompleting ? "처리중..." : "완료하기"}
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
