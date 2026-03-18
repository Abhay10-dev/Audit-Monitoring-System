"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Shield, UserCheck, UserX, ChevronDown, Loader2, Users } from "lucide-react";

interface User {
  id: string;
  email: string;
  display_name: string | null;
  role: "admin" | "manager" | "employee";
  is_blocked: boolean;
  is_active: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await apiFetch<{ data: User[] }>("/api/admin/users");
      setUsers(res.data);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId: string, newRole: "employee" | "manager") => {
    setActionLoading(userId + "_role");
    setSuccess(""); setError("");
    try {
      await apiFetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      setSuccess(`Role updated to ${newRole} successfully.`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (e: any) {
      setError(e.message || "Failed to update role.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlock = async (userId: string, blocked: boolean) => {
    setActionLoading(userId + "_block");
    setSuccess(""); setError("");
    try {
      await apiFetch(`/api/admin/users/${userId}/block`, {
        method: "PATCH",
        body: JSON.stringify({ blocked }),
      });
      setSuccess(blocked ? "User blocked." : "User unblocked.");
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_blocked: blocked } : u));
    } catch (e: any) {
      setError(e.message || "Failed to update block status.");
    } finally {
      setActionLoading(null);
    }
  };

  const roleBadgeClass = (role: string) => {
    if (role === "admin") return "bg-purple-500/15 text-purple-300 border-purple-500/30";
    if (role === "manager") return "bg-blue-500/15 text-blue-300 border-blue-500/30";
    return "bg-slate-700 text-slate-300 border-slate-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15">
          <Users className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">User Management</h1>
          <p className="text-sm text-slate-400">Manage roles and access for all system users.</p>
        </div>
      </div>

      {/* Feedback banners */}
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-3 text-sm text-green-400">
          {success}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
              <th className="px-5 py-3 text-left">User</th>
              <th className="px-5 py-3 text-left">Role</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-left">Joined</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-500">No users found.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white uppercase">
                        {user.email.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-200">{user.display_name || "—"}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {user.role === "admin" ? (
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${roleBadgeClass(user.role)}`}>
                        <Shield className="h-3 w-3" /> Admin
                      </span>
                    ) : (
                      <div className="relative inline-block">
                        <select
                          value={user.role}
                          disabled={actionLoading === user.id + "_role"}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as "employee" | "manager")}
                          className={`appearance-none rounded-full border px-2.5 py-0.5 pr-6 text-xs font-semibold bg-transparent cursor-pointer focus:outline-none ${roleBadgeClass(user.role)}`}
                        >
                          <option value="employee">Employee</option>
                          <option value="manager">Manager</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-1.5 top-1 h-3 w-3 text-slate-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {user.is_blocked ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 text-xs font-semibold text-red-400">
                        <UserX className="h-3 w-3" /> Blocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 border border-green-500/30 px-2.5 py-0.5 text-xs font-semibold text-green-400">
                        <UserCheck className="h-3 w-3" /> Active
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-400 text-xs">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {user.role !== "admin" && (
                      <button
                        disabled={actionLoading === user.id + "_block"}
                        onClick={() => handleBlock(user.id, !user.is_blocked)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                          user.is_blocked
                            ? "bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30"
                            : "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
                        }`}
                      >
                        {actionLoading === user.id + "_block" ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : user.is_blocked ? "Unblock" : "Block"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
