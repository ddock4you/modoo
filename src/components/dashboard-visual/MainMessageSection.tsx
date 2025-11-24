/**
 * 메인 메시지 섹션 컴포넌트
 * 상태: 항상 표시 (동적 메시지)
 */
export interface MainMessageSectionProps {
  message: string;
}

export function MainMessageSection({ message }: MainMessageSectionProps) {
  return <h2 className="text-2xl font-bold text-[#4E4946] mb-5">{message}</h2>;
}
