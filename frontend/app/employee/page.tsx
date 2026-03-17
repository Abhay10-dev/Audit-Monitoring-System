"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { ActivityLogsTable } from "@/components/activity/ActivityLogsTable";
import { AlertsPanel } from "@/components/shared/AlertsPanel";
import { KpiCard } from "@/components/shared/KpiCard";
import { Clock, ShieldCheck, Activity } from "lucide-react";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">My Dashboard</h1>
          <p className="text-sm text-slate-400">Welcome back, {user?.displayName || user?.email}.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Risk Status" value="Healthy" icon={ShieldCheck} variant="success" />
        <KpiCard title="Active Sessions" value="1" icon={Activity} />
        <KpiCard title="Last Login" value="Just now" icon={Clock} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <h2 className="text-sm font-semibold text-slate-100 mb-4">My Activity Logs</h2>
          <ActivityLogsTable global={false} />
        </div>
        <div className="xl:col-span-1">
          <AlertsPanel global={false} limit={5} />
        </div>
      </div>
    </div>
  );
}
