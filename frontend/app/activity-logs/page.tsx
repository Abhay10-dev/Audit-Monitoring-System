"use client";

import { ActivityLogsTable } from "@/components/activity/ActivityLogsTable";
import { DownloadCloud } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

export default function ActivityLogsPage() {
  const { user } = useAuth();
  
  const handleExport = () => {
    // Basic redirect for download. Assumes the API endpoint can authenticate via cookie 
    // or we fetch the blob directly and trigger download if using Bearer tokens.
    // For MVP with JWT in localStorage, we must fetch and trigger blob download:
    const token = localStorage.getItem("ams_token");
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    
    fetch(`${baseUrl}/api/analytics/report/csv`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "risk_report.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
    })
    .catch(console.error);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">System Activity Logs</h1>
          <p className="text-sm text-slate-400">
            Comprehensive, real-time audit trail of all user interactions across the platform.
          </p>
        </div>
        
        {user?.role === "admin" && (
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium border border-slate-700"
          >
            <DownloadCloud className="h-4 w-4" />
            Export CSV
          </button>
        )}
      </div>

      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
        <ActivityLogsTable global={true} />
      </div>
    </div>
  );
}
