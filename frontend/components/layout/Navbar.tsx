"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { Bell, LogOut, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface NavbarProps {
  title: string;
}

export function Navbar({ title }: NavbarProps) {
  const { user, logout } = useAuth();
  const [alertCount, setAlertCount] = useState(0);
  const [showProfile, setShowProfile] = useState(false);

  // Poll for new alert count every 30 seconds
  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const data = await apiFetch<{ pagination: { total: number } }>(
          "/api/alerts?status=new&limit=1"
        );
        setAlertCount(data.pagination.total);
      } catch {
        // Silently fail
      }
    };
    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm px-6">
      <h1 className="text-lg font-semibold text-slate-100">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors">
          <Bell className="h-5 w-5" />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {alertCount > 9 ? "9+" : alertCount}
            </span>
          )}
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfile((v) => !v)}
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
