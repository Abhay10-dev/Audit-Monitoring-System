"use client";

import { useAuth } from "@/components/providers/AuthProvider";

export default function UsersPage() {
  const { user } = useAuth();
  
  if (user?.role !== "admin") {
    return <div className="p-8 text-slate-400">Access Denied. Admins only.</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">User Management</h1>
        <p className="text-sm text-slate-400">View and manage system users and roles.</p>
      </div>

      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-8 text-center text-slate-500">
        <p>User management table will be implemented in future phases.</p>
      </div>
    </div>
  );
}
