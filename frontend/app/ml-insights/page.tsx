"use client";

import { KpiCard } from "@/components/shared/KpiCard";
import { AlertsPanel } from "@/components/shared/AlertsPanel";
import { ActivityLogsTable } from "@/components/activity/ActivityLogsTable";
import { BrainCircuit, FileSearch, ShieldAlert, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function MlInsightsPage() {
  const [data, setData] = useState<{ date: string; avgScore: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMLData = async () => {
      try {
        const trendsRes = await apiFetch<{ date: string; avg_score: string }[]>("/api/analytics/anomaly-trends?days=7");
        
        if (!trendsRes || trendsRes.length === 0) {
          // Fallback just for display if DB is totally empty
          setData([
            { date: "Oct 1", avgScore: 12 },
            { date: "Oct 2", avgScore: 15 },
            { date: "Oct 3", avgScore: 8 },
            { date: "Oct 4", avgScore: 35 },
            { date: "Oct 5", avgScore: 82 },
            { date: "Oct 6", avgScore: 24 },
            { date: "Oct 7", avgScore: 18 },
          ]);
          return;
        }

        const chartData = trendsRes.map((day) => ({
          date: new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          avgScore: parseInt(day.avg_score || "0")
        }));

        setData(chartData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMLData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Machine Learning Insights</h1>
        <p className="text-sm text-slate-400">Analysis of the IsolationForest anomaly detection model behavior.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Active Model" value="IsolationForest v1.2" icon={BrainCircuit} variant="default" />
        <KpiCard title="Avg Anomaly Score" value="24%" icon={Activity} trend={-5} />
        <KpiCard title="False Positives" value="3" icon={ShieldAlert} trend={1} variant="warning" />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Detection Graph */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="text-sm font-semibold text-slate-100 mb-6 flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-400" />
            Avg ML Anomaly Score (7 Days)
          </h2>
          <div className="h-[300px] w-full">
            {loading ? (
              <div className="w-full h-full animate-pulse bg-slate-800/50 rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ stroke: '#334155' }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgScore" 
                    name="Avg ML Score"
                    stroke="#8B5CF6" 
                    strokeWidth={3} 
                    dot={{ fill: '#8B5CF6', r: 4 }} 
                    activeDot={{ r: 6, fill: '#A78BFA' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Feature Weights (Static demo for XAI) */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="text-sm font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <FileSearch className="h-4 w-4 text-purple-400" />
            Top Feature Drivers
          </h2>
          <div className="space-y-4 mt-6">
            <FeatureBar label="Unrecognized Device" weight={78} />
            <FeatureBar label="Off-Hours Login" weight={64} />
            <FeatureBar label="Unrecognized IP" weight={52} />
            <FeatureBar label="High Failure Rate" weight={41} />
            <FeatureBar label="Session Duration" weight={12} />
          </div>
          <p className="text-xs text-slate-500 mt-6 text-center">
            Features currently driving the highest anomaly scores across the platform.
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureBar({ label, weight }: { label: string; weight: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400 font-mono">{weight}%</span>
      </div>
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full" 
          style={{ width: `${weight}%` }} 
        />
      </div>
    </div>
  );
}
