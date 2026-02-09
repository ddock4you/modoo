import type { ReactNode } from "react";

export function KpiCard({
  title,
  value,
  footer,
  className,
}: {
  title: string;
  value: string;
  footer?: ReactNode;
  className: string;
}) {
  return (
    <div className={className}>
      <div className="text-center text-sm font-medium mb-1">{title}</div>
      <div className="text-center font-bold">{value}</div>
      {footer ? <div className="text-center mt-1">{footer}</div> : null}
    </div>
  );
}
