"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  LayoutDashboard,
  BellRing,
  ListChecks,
  Settings,
  Users,
  BrainCircuit,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin",    label: "Dashboard",     icon: LayoutDashboard, roles: ["admin"] },
  { href: "/manager",  label: "Dashboard",     icon: LayoutDashboard, roles: ["manager"] },
  { href: "/employee", label: "Dashboard",     icon: LayoutDashboard, roles: ["employee"] },
  { href: "/alerts",   label: "Alerts",        icon: BellRing,        roles: ["admin", "manager", "employee"] },
  { href: "/activity-logs", label: "Activity Logs", icon: ListChecks, roles: ["admin", "manager", "employee"] },
  { href: "/ml-insights", label: "ML Insights", icon: BrainCircuit,  roles: ["admin"] },
  { href: "/users",    label: "Users",         icon: Users,           roles: ["admin"] },
  { href: "/settings", label: "Settings",      icon: Settings,        roles: ["admin", "manager", "employee"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role || "employee";

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 border-r border-slate-800">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-500/30">
          <ShieldAlert className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white tracking-wide">AuditMS</p>
          <p className="text-xs text-slate-500 capitalize">{role} Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-blue-600/15 text-blue-400 shadow-inner"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-blue-400")} />
              {item.label}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 px-4 py-3">
        <p className="text-xs text-slate-600 text-center">AMS v1.0 · Phase 8</p>
      </div>
    </aside>
  );
}
