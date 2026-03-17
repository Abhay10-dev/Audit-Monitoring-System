"use client";

import { usePathname } from "next/navigation";
import { DashboardLayout } from "./DashboardLayout";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Don't render sidebar/navbar on login page or loading states
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // Derive title from pathname
  const titleMap: Record<string, string> = {
    "/admin": "Admin Dashboard",
    "/manager": "Manager Dashboard",
    "/employee": "My Dashboard",
    "/alerts": "Alerts Center",
    "/activity-logs": "Global Activity Logs",
    "/ml-insights": "ML Detection Insights",
    "/users": "User Management",
    "/settings": "System Settings",
  };
  
  const title = Object.entries(titleMap).find(([k]) => pathname.startsWith(k))?.[1] || "AuditMS";

  return (
    <DashboardLayout title={title}>
      {children}
    </DashboardLayout>
  );
}
