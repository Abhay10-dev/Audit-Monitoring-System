"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { Bell, LogOut, ChevronDown, AlertTriangle, ArrowRight, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AlertItem {
  id: string;
  final_score: number;
  reasons: string[] | string;
  created_at: string;
  email: string;
  status: string;
}

interface NavbarProps {
  title: string;
}

export function Navbar({ title }: NavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [alertCount, setAlertCount] = useState(0);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [showBell, setShowBell] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setShowBell(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Poll for new alert count + latest alerts every 30 seconds
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await apiFetch<{ data: AlertItem[]; pagination: { total: number } }>(
          "/api/alerts?status=new&limit=5"
        );
        setAlertCount(data.pagination?.total ?? 0);
        setAlerts(data.data ?? []);
      } catch {
        // Silently fail
      }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const severityColor = (score: number) => {
    if (score > 70) return "text-red-400";
    if (score > 30) return "text-yellow-400";
    return "text-blue-400";
  };

  const alertLabel = (alert: AlertItem) => {
    const reasons = Array.isArray(alert.reasons) ? alert.reasons : JSON.parse(alert.reasons || "[]");
    return reasons.length > 0 ? reasons[0] : `Risk score: ${alert.final_score}`;
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm px-6">
      <h1 className="text-lg font-semibold text-slate-100">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => { setShowBell((v) => !v); setShowProfile(false); }}
            className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {alertCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            )}
          </button>

          {showBell && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-700 bg-slate-800 shadow-2xl shadow-black/40 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                <p className="text-xs font-semibold text-slate-100">New Alerts</p>
                {alertCount > 0 && (
                  <span className="rounded-full bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-[10px] font-bold text-red-400">
                    {alertCount} unread
                  </span>
                )}
              </div>
              <div className="divide-y divide-slate-700/50 max-h-72 overflow-y-auto">
                {alerts.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-slate-500">No new alerts 🎉</p>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className="px-4 py-3 hover:bg-slate-700/40 transition-colors">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${severityColor(alert.final_score)}`} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-200 line-clamp-2">{alertLabel(alert)}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {alert.email} · {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-slate-700 px-4 py-2">
                <Link
                  href="/alerts"
                  onClick={() => setShowBell(false)}
                  className="flex items-center justify-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors py-1"
                >
                  View all alerts <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setShowProfile((v) => !v); setShowBell(false); }}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white uppercase">
              {user?.email?.charAt(0) ?? "U"}
            </div>
            <span className="hidden sm:block max-w-[120px] truncate">{user?.email}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-700 bg-slate-800 shadow-2xl shadow-black/40 p-2 z-50">
              <div className="px-3 py-2 mb-1">
                <p className="text-xs font-semibold text-slate-100 truncate">{user?.email}</p>
                <p className="text-xs capitalize text-slate-400">{user?.role}</p>
              </div>
              <hr className="border-slate-700 mb-1" />
              <Link
                href="/profile"
                onClick={() => setShowProfile(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
              >
                <User className="h-4 w-4" />
                My Profile
              </Link>
              <hr className="border-slate-700 my-1" />
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
