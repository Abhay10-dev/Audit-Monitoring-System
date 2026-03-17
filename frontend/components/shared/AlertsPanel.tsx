"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { RiskBadge } from "./RiskBadge";
import { CheckCheck, ShieldOff, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Alert {
  id: string;
  status: "new" | "acknowledged" | "resolved";
  created_at: string;
  final_score: number;
  reasons: string | string[];
  email: string;
  user_id: string;
}

interface AlertsPanelProps {
  /** If true, shows all users' alerts (Admin/Manager view). If false, shows current user only. */
  global?: boolean;
  limit?: number;
}

export function AlertsPanel({ global: isGlobal = false, limit = 5 }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await apiFetch<{ data: Alert[] }>(`/api/alerts?limit=${limit}&status=new`);
      setAlerts(data.data);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const updateStatus = async (id: string, status: "acknowledged" | "resolved") => {
    try {
      await apiFetch(`/api/alerts/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // Silently fail
    }
  };

  const parseReasons = (reasons: string | string[]): string[] => {
    if (Array.isArray(reasons)) return reasons;
    try { return JSON.parse(reasons); } catch { return [String(reasons)]; }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-slate-100">
          {isGlobal ? "Recent System Alerts" : "My Alerts"}
        </h2>
        <button
          onClick={fetchAlerts}
          className="text-slate-500 hover:text-slate-300 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-800/60 animate-pulse" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-600">
          <ShieldOff className="h-8 w-8 mb-2" />
          <p className="text-sm">No active alerts</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-800/50">
          {alerts.map((alert) => {
            const reasons = parseReasons(alert.reasons);
            return (
              <li key={alert.id} className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-slate-800/30 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <RiskBadge level={alert.final_score} />
                    <span className="text-xs text-slate-500 truncate">
                      {isGlobal ? alert.email : ""}
                    </span>
                    <span className="ml-auto text-xs text-slate-600 shrink-0">
                      {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{reasons[0] ?? "Suspicious activity detected"}</p>
                </div>

                <div className="flex shrink-0 gap-1 mt-0.5">
                  <button
                    onClick={() => updateStatus(alert.id, "acknowledged")}
                    title="Acknowledge"
                    className="rounded-lg p-1.5 text-amber-400 hover:bg-amber-500/10 transition-colors"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => updateStatus(alert.id, "resolved")}
                    title="Resolve"
                    className="rounded-lg p-1.5 text-green-400 hover:bg-green-500/10 transition-colors"
                  >
                    <ShieldOff className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
