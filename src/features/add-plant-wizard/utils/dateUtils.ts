// 날짜/시간 관련 유틸리티 함수들

/**
 * 날짜를 KST 기준 정오(12:00)로 변환하여 epoch ms 반환
 */
export function toKstNoon(date: Date): number {
  const utc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 3, 0, 0, 0);
  // UTC+9(Asia/Seoul) 정오와 동일한 시점
  return utc;
}

/**
 * 날짜를 KST 기준 자정(00:00)으로 변환하여 epoch ms 반환
 */
export function toKstMidnight(date: Date): number {
  const utc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 15, 0, 0, 0);
  // UTC+9 자정
  return utc;
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷팅
 */
export function formatYmd(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
