"use client";

import { AlertsPanel } from "@/components/shared/AlertsPanel";
import { useAuth } from "@/components/providers/AuthProvider";

export default function AlertsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "manager";

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Alerts Center</h1>
        <p className="text-sm text-slate-400">
          {isAdmin ? "Manage and resolve system-wide security alerts." : "View your personal security notifications."}
        </p>
      </div>

      <AlertsPanel global={isAdmin} limit={20} />
    </div>
  );
}
