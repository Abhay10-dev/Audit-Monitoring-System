"use client";

import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <div className="pl-64 flex flex-col min-h-screen">
        <Navbar title={title} />
        <main className="flex-1 p-6 space-y-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
