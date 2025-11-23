import clsx from "clsx";
import type { ReactNode } from "react";

type PlantBadgeTone = "danger" | "warning" | "accent" | "muted";

const toneClasses: Record<PlantBadgeTone, string> = {
  danger: "bg-red-600/90 border border-red-500/70",
  warning: "bg-amber-500/90 border border-amber-400/60",
  accent: "bg-emerald-500/80 border border-emerald-400/60",
  muted: "bg-[#A4A4A4] ",
};

interface PlantBadgeProps {
  label: string;
  tone?: PlantBadgeTone;
  icon?: ReactNode;
  className?: string;
}

export default function PlantBadge({ label, tone = "muted", icon, className }: PlantBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-tl- pl-2 pr-1 py-1 rounded-tl-lg rounded-bl-lg text-xs font-bold text-white",
        toneClasses[tone],
        className
      )}
    >
      {icon}
      {label}
    </span>
  );
}
