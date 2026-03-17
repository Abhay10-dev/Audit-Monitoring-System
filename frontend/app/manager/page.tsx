"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { ActivityLogsTable } from "@/components/activity/ActivityLogsTable";
import { KpiCard } from "@/components/shared/KpiCard";
import { Users, AlertCircle, TrendingUp } from "lucide-react";

export default function ManagerDashboard() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Manager Dashboard</h1>
          <p className="text-sm text-slate-400">Welcome, {user?.displayName || user?.email}. Managing team metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Team Members" value="12" icon={Users} trend={2} trendLabel="vs last month" />
        <KpiCard title="Team Alerts" value="3" icon={AlertCircle} variant="warning" />
        <KpiCard title="Avg Productivity" value="94%" icon={TrendingUp} variant="success" />
      </div>

      <section className="pt-4 border-t border-slate-800">
        <h2 className="text-sm font-semibold text-slate-100 mb-4">Team Activity Logs</h2>
        {/* Managers can view all logs similar to admins in this MVP */}
        <ActivityLogsTable global={true} /> 
      </section>
    </div>
  );
}
