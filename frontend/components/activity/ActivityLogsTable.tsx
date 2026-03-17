"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Loader2, Download } from "lucide-react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { useAuth } from "@/components/providers/AuthProvider";

interface ActivityLog {
  id: string;
  activity_type: string;
  description: string;
  ip_address: string;
  device_info: string;
  timestamp: string;
  email?: string;
  display_name?: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
}

export function ActivityLogsTable({ global = false }: { global?: boolean }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [activityType, setActivityType] = useState<string>("all");
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("ams_token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      
      // If global is true, fetch all logs (Admin/Manager only), else fetch user's logs
      let endpoint = global 
        ? `/api/activity?page=${page}&limit=${limit}` 
        : `/api/activity/user/${user.id}?page=${page}&limit=${limit}`;

      if (activityType !== "all") {
        endpoint += `&activityType=${activityType}`;
      }

      const res = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error("Failed to fetch activity logs");
      }

      const rawData = await res.json();
      setLogs(rawData.data || []);
      setMeta(rawData.pagination || null);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [user, global, page, limit, activityType]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    
    // Simple CSV generation
    const headers = ["Timestamp", "Activity Type", "Description", "IP", "Device"];
    if (global) headers.splice(1, 0, "User");

    const csvRows = [headers.join(",")];
    
    logs.forEach(log => {
      const row = [
        format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss"),
        log.activity_type,
        `"${log.description.replace(/"/g, '""')}"`, // escape quotes
        log.ip_address || "N/A",
        `"${(log.device_info || "N/A").replace(/"/g, '""')}"`
      ];
      if (global) row.splice(1, 0, log.email || "Unknown");
      csvRows.push(row.join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `activity_logs_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActivityBadgeVariant = (type: string) => {
    switch(type) {
      case 'login': return 'default';
      case 'logout': return 'secondary';
      case 'alert_resolved': return 'outline';
      case 'anomaly_flagged': return 'destructive';
      case 'api_call': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-slate-800 p-4 rounded-lg border border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400 font-medium">Filter Type:</span>
          <Select value={activityType} onValueChange={(val) => { setActivityType(val); setPage(1); }}>
            <SelectTrigger className="w-[180px] bg-slate-900 border-slate-700">
              <SelectValue placeholder="All Activities" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="login">Logins</SelectItem>
              <SelectItem value="logout">Logouts</SelectItem>
              <SelectItem value="api_call">API Interactions</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          variant="outline" 
          onClick={handleExportCSV}
          className="border-slate-600 hover:bg-slate-700 text-slate-300"
          disabled={logs.length === 0}
        >
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border border-slate-700 bg-slate-800/50 overflow-hidden text-slate-300">
        <Table>
          <TableHeader className="bg-slate-800">
            <TableRow className="border-slate-700 hover:bg-slate-800">
              <TableHead className="text-slate-400">Timestamp</TableHead>
              {global && <TableHead className="text-slate-400">User</TableHead>}
              <TableHead className="text-slate-400">Activity</TableHead>
              <TableHead className="text-slate-400 hidden md:table-cell">Description</TableHead>
              <TableHead className="text-slate-400 hidden lg:table-cell">Context</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={global ? 5 : 4} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={global ? 5 : 4} className="h-24 text-center text-red-400">
                  {error}
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={global ? 5 : 4} className="h-24 text-center text-slate-500">
                  No activity logs found.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="border-slate-700 hover:bg-slate-700/50 transition-colors">
                  <TableCell className="font-mono text-xs whitespace-nowrap text-slate-400">
                    {format(new Date(log.timestamp), "MMM d, HH:mm:ss")}
                  </TableCell>
                  {global && (
                    <TableCell className="font-medium">
                      {log.email || "Unknown"}
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant={getActivityBadgeVariant(log.activity_type)} className="capitalize pb-0.5">
                      {log.activity_type.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-[200px] truncate" title={log.description}>
                    {log.description}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-slate-500">
                    <div>IP: {log.ip_address || "N/A"}</div>
                    <div className="truncate max-w-[150px]" title={log.device_info}>Device: {log.device_info || "N/A"}</div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {meta && meta.total > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-400 mt-4 px-2">
          <div>
            Showing {((meta.page - 1) * meta.limit) + 1} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} entries
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white"
              onClick={() => setPage(p => p + 1)}
              disabled={(page * limit) >= meta.total || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
