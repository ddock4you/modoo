import type { TaskRule } from "../types";

/**
 * 작업 규칙의 다음 예정일을 계산합니다.
 * lastDoneAt + intervalDays를 기준으로 계산하며,
 * lastDoneAt이 null인 경우 현재 시간을 기준으로 계산합니다.
 */
export function calculateNextDue(rule: TaskRule, nowMs: number = Date.now()): number {
  const baseTime = rule.lastDoneAt ?? nowMs;
  const intervalMs = rule.intervalDays * 24 * 60 * 60 * 1000; // 일수를 밀리초로 변환
  return baseTime + intervalMs;
}

/**
 * 작업 완료 시 규칙을 갱신하는 헬퍼 함수
 * lastDoneAt을 현재 시간으로 설정하고 nextDueAt을 재계산합니다.
 */
export function updateRuleAfterTaskCompletion(rule: TaskRule, nowMs: number = Date.now()): TaskRule {
  const now = nowMs;
  return {
    ...rule,
    lastDoneAt: now,
    nextDueAt: calculateNextDue({ ...rule, lastDoneAt: now }),
    updatedAt: now,
  };
}
