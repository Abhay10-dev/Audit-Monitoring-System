"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { UserX, UserCheck, Loader2, Shield } from "lucide-react";

interface Employee {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  is_blocked: boolean;
}

export default function ManagerEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchEmployees = async () => {
    try {
      const res = await apiFetch<{ data: Employee[] }>("/api/manager/employees");
      setEmployees(res.data);
    } catch {
      setError("Failed to load employees.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleBlock = async (employeeId: string, blocked: boolean) => {
    setActionLoading(employeeId);
    setSuccess(""); setError("");
    try {
      await apiFetch(`/api/manager/employees/${employeeId}/block`, {
        method: "PATCH",
        body: JSON.stringify({ blocked }),
      });
      setSuccess(blocked ? "Employee blocked successfully." : "Employee unblocked.");
      setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, is_blocked: blocked } : e));
    } catch (e: any) {
      setError(e.message || "Failed to update employee.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15">
          <Shield className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Manage Employees</h1>
          <p className="text-sm text-slate-400">View and manage employee access in your team.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-3 text-sm text-green-400">{success}</div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
              <th className="px-5 py-3 text-left">Employee</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="px-5 py-10 text-center text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              </td></tr>
            ) : employees.length === 0 ? (
              <tr><td colSpan={3} className="px-5 py-10 text-center text-slate-500">No employees found.</td></tr>
            ) : employees.map((emp) => (
              <tr key={emp.id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white uppercase">
                      {emp.email.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">{emp.display_name || "—"}</p>
                      <p className="text-xs text-slate-500">{emp.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  {emp.is_blocked ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 text-xs font-semibold text-red-400">
                      <UserX className="h-3 w-3" /> Blocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 border border-green-500/30 px-2.5 py-0.5 text-xs font-semibold text-green-400">
                      <UserCheck className="h-3 w-3" /> Active
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    disabled={actionLoading === emp.id}
                    onClick={() => handleBlock(emp.id, !emp.is_blocked)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                      emp.is_blocked
                        ? "bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30"
                        : "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
                    }`}
                  >
                    {actionLoading === emp.id ? <Loader2 className="h-3 w-3 animate-spin" /> : emp.is_blocked ? "Unblock" : "Block"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
