"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== "/login") {
        router.push("/login");
      } else if (user && pathname === "/login") {
        // Redirect authenticated users away from login
        if (user.role === "admin") router.push("/admin");
        else if (user.role === "manager") router.push("/manager");
        else router.push("/employee");
      } else if (user && allowedRoles && !allowedRoles.includes(user.role)) {
        // Unauthenticated for this specific route role
        router.push("/unauthorized");
      }
    }
  }, [user, loading, router, pathname, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // If not loading, and we require a user but don't have one (and we aren't on login), render nothing while redirecting
  if (!user && pathname !== "/login") return null;

  return <>{children}</>;
}
