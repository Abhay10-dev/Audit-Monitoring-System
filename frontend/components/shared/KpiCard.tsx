"use client";

import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;          // positive = up, negative = down
  trendLabel?: string;
  variant?: "default" | "danger" | "warning" | "success";
  loading?: boolean;
}

const variantStyles = {
  default: "from-slate-800/60 to-slate-900/60 border-slate-700/50",
  danger:  "from-red-950/40 to-slate-900/60 border-red-800/30",
  warning: "from-amber-950/40 to-slate-900/60 border-amber-800/30",
  success: "from-green-950/40 to-slate-900/60 border-green-800/30",
};

const iconStyles = {
  default: "bg-blue-500/15 text-blue-400",
  danger:  "bg-red-500/15 text-red-400",
  warning: "bg-amber-500/15 text-amber-400",
  success: "bg-green-500/15 text-green-400",
};

export function KpiCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  variant = "default",
  loading = false,
}: KpiCardProps) {
  const TrendIcon = trend === undefined || trend === 0 ? Minus : trend > 0 ? TrendingUp : TrendingDown;
  const trendColor = trend === undefined || trend === 0
    ? "text-slate-500"
    : trend > 0
    ? "text-red-400"    // more alerts/risks = bad
    : "text-green-400"; // fewer = good

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/30",
      variantStyles[variant]
    )}>
      {/* Subtle glow blob */}
      <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/3 blur-2xl" />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
          {loading ? (
            <div className="mt-2 h-8 w-24 rounded-md bg-slate-700/60 animate-pulse" />
          ) : (
            <p className="mt-1 text-3xl font-bold text-slate-50">{value}</p>
          )}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", iconStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {trend !== undefined && (
        <div className={cn("mt-3 flex items-center gap-1 text-xs font-medium", trendColor)}>
          <TrendIcon className="h-3.5 w-3.5" />
          <span>{Math.abs(trend)}% {trendLabel ?? "vs last week"}</span>
        </div>
      )}
    </div>
  );
}
