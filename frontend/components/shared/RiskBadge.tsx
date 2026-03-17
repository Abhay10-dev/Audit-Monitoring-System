"use client";

import { cn } from "@/lib/utils";

export type RiskLevel = "Low" | "Medium" | "High" | "low" | "medium" | "high";

interface RiskBadgeProps {
  level: RiskLevel | number;
  className?: string;
}

function resolveLevel(level: RiskLevel | number): "Low" | "Medium" | "High" {
  if (typeof level === "number") {
    if (level > 70) return "High";
    if (level > 30) return "Medium";
    return "Low";
  }
  const normalized = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
  return normalized as "Low" | "Medium" | "High";
}

const riskStyles: Record<"Low" | "Medium" | "High", string> = {
  Low:    "bg-green-500/15 text-green-400 border-green-500/30",
  Medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  High:   "bg-red-500/15 text-red-400 border-red-500/30",
};

const riskDots: Record<"Low" | "Medium" | "High", string> = {
  Low:    "bg-green-400",
  Medium: "bg-amber-400",
  High:   "bg-red-400 animate-pulse",
};

export function RiskBadge({ level, className }: RiskBadgeProps) {
  const resolved = resolveLevel(level);
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
      riskStyles[resolved],
      className
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full", riskDots[resolved])} />
      {resolved}
    </span>
  );
}
