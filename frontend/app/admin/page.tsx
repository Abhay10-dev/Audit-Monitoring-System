"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { ActivityLogsTable } from "@/components/activity/ActivityLogsTable";
import { KpiCard } from "@/components/shared/KpiCard";
import { AlertsPanel } from "@/components/shared/AlertsPanel";
import { Users, AlertTriangle, ShieldX, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function AdminDashboard() {
  const { user } = useAuth();
  
  // Minimal state for dashboard overview data (Phase 9 will introduce proper analytics endpoints)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeAlerts: 0,
    highRiskUsers: 0,
    anomaliesDetect: 0,
  });
  const [loading, setLoading] = useState(true);
  const [riskData, setRiskData] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [usersRes, alertsRes, riskRes, anomalyRes] = await Promise.all([
          apiFetch<{ data: any[] }>("/api/admin/users?limit=1"), // just for count metadata if paginated, or we can use another endpoint. MVP: we'll fetch list
          apiFetch<{ status: string; count: string }[]>("/api/analytics/alerts-summary"),
          apiFetch<{ risk_level: string; count: string }[]>("/api/analytics/risk-distribution"),
          apiFetch<{ date: string; count: string }[]>("/api/analytics/anomaly-trends?days=30"),
        ]);

        const usersCount = usersRes.data?.length || 0;
        
        const activeAlerts = alertsRes.find(a => a.status === 'new')?.count || "0";
        
        let low = 0, med = 0, high = 0;
        riskRes.forEach((r) => {
          if (r.risk_level === 'High') high = parseInt(r.count);
          if (r.risk_level === 'Medium') med = parseInt(r.count);
          if (r.risk_level === 'Low') low = parseInt(r.count);
        });

        const anomalies30d = anomalyRes.reduce((sum, day) => sum + parseInt(day.count), 0);

        setStats({
          totalUsers: usersCount,
          activeAlerts: parseInt(activeAlerts as string),
          highRiskUsers: high,
          anomaliesDetect: anomalies30d,
        });

        setRiskData([
          { name: "Low", count: low },
          { name: "Medium", count: med },
          { name: "High", count: high },
        ]);
        
      } catch (error) {
        console.error("Dashboard data fetch failed", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const riskColors = { Low: "#22C55E", Medium: "#F59E0B", High: "#EF4444" };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Admin Overview</h1>
        <p className="text-sm text-slate-400">System-wide monitoring & risk detection capabilities.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Total Users" 
          value={stats.totalUsers} 
          icon={Users} 
          loading={loading}
        />
        <KpiCard 
          title="Active Alerts" 
          value={stats.activeAlerts} 
          icon={AlertTriangle} 
          variant={stats.activeAlerts > 0 ? "danger" : "success"}
          loading={loading}
        />
        <KpiCard 
          title="High Risk Users" 
          value={stats.highRiskUsers} 
          icon={ShieldX} 
          variant={stats.highRiskUsers > 0 ? "warning" : "default"}
          loading={loading}
        />
        <KpiCard 
          title="Anomalies (30d)" 
          value={stats.anomaliesDetect} 
          icon={Activity} 
          trend={12} 
          loading={loading}
        />
      </div>

      {/* Charts & Alerts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Risk Distribution Chart */}
        <div className="xl:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="text-sm font-semibold text-slate-100 mb-6">Recent Risk Distribution</h2>
          <div className="h-[300px] w-full">
            {loading ? (
              <div className="w-full h-full animate-pulse bg-slate-800/50 rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#1e293b' }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={riskColors[entry.name as keyof typeof riskColors]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="xl:col-span-1 h-[400px] overflow-y-auto custom-scrollbar">
          <AlertsPanel global={true} limit={6} />
        </div>
      </div>

      {/* Global Activity Table */}
      <section className="pt-4">
        <h2 className="text-sm font-semibold text-slate-100 mb-4">Latest System Activity</h2>
        <ActivityLogsTable global={true} />
      </section>
    </div>
  );
}
