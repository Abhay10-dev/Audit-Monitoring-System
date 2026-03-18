"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { apiFetch } from "@/lib/api";
import { User, Mail, Shield, Activity, Edit2, Check, X, Loader2 } from "lucide-react";

interface ProfileData {
  user: {
    id: string;
    email: string;
    display_name: string | null;
    role: string;
    is_active: boolean;
    is_blocked: boolean;
    created_at: string;
  };
  recentActivity: {
    activity_type: string;
    description: string;
    ip_address: string;
    timestamp: string;
  }[];
}

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    apiFetch<ProfileData>("/api/profile")
      .then((data) => {
        setProfile(data);
        setNewName(data.user.display_name || "");
      })
      .catch(() => setFeedback({ type: "error", msg: "Failed to load profile." }))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveName = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await apiFetch<{ user: any }>("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ displayName: newName }),
      });
      setProfile((prev) => prev ? { ...prev, user: { ...prev.user, display_name: res.user.display_name } } : prev);
      setEditingName(false);
      setFeedback({ type: "success", msg: "Display name updated." });
    } catch {
      setFeedback({ type: "error", msg: "Failed to update name." });
    } finally {
      setSaving(false);
    }
  };

  const roleColor = {
    admin: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    manager: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    employee: "bg-slate-700 text-slate-300 border-slate-600",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!profile) return null;

  const { user: u, recentActivity } = profile;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">My Profile</h1>
        <p className="text-sm text-slate-400">Manage your account information and view recent activity.</p>
      </div>

      {feedback && (
        <div className={`rounded-lg px-4 py-3 text-sm border ${
          feedback.type === "success"
            ? "bg-green-500/10 border-green-500/30 text-green-400"
            : "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>
          {feedback.msg}
        </div>
      )}

      {/* Profile Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white uppercase">
            {u.email.charAt(0)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Display Name */}
            <div className="flex items-center gap-3">
              {editingName ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your display name"
                    maxLength={80}
                  />
                  <button onClick={handleSaveName} disabled={saving} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50">
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => setEditingName(false)} className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-600">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-slate-100">
                    {u.display_name || "Unnamed User"}
                  </span>
                  <button onClick={() => setEditingName(true)} className="text-slate-500 hover:text-slate-300 transition-colors">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Meta info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate">{u.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Shield className="h-4 w-4 shrink-0" />
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${roleColor[u.role as keyof typeof roleColor] || roleColor.employee}`}>
                  {u.role}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <User className="h-4 w-4 shrink-0" />
                <span>{u.is_blocked ? "🔴 Account Suspended" : "🟢 Active"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Activity className="h-4 w-4 shrink-0" />
                <span>Joined {new Date(u.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        <div className="border-b border-slate-800 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-100">Recent Activity</h2>
        </div>
        <div className="divide-y divide-slate-800/60">
          {recentActivity.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">No recent activity found.</p>
          ) : (
            recentActivity.map((log, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-200 capitalize">{log.activity_type.replace(/_/g, " ")}</p>
                  <p className="text-xs text-slate-500">{log.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-400">{log.ip_address || "—"}</p>
                  <p className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
