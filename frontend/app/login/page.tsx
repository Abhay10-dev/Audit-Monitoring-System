"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, User, Users, ShieldCheck, Info } from "lucide-react";

type Role = "employee" | "manager" | "admin";

const ROLE_OPTIONS: { value: Role; label: string; description: string; icon: React.ElementType }[] = [
  { value: "employee", label: "Employee", description: "Audit your own activity", icon: User },
  { value: "manager", label: "Manager", description: "Manage your team's activity", icon: Users },
  { value: "admin", label: "Admin", description: "Full system access", icon: ShieldCheck },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [selectedRole, setSelectedRole] = useState<Role>("employee");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const authenticateWithBackend = async (firebaseUser: any) => {
    const token = await firebaseUser.getIdToken();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        displayName: firebaseUser.displayName,
        ipAddress: "127.0.0.1",
        deviceInfo: navigator.userAgent,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Backend authentication failed");
    }

    const { user, sessionId } = await response.json();
    return { token, user: { ...user, sessionId } };
  };

  const handleRoute = (user: any) => {
    // Always route to actual role — regardless of role selected on login page
    if (user.role === "admin") router.push("/admin");
    else if (user.role === "manager") router.push("/manager");
    else router.push("/employee");

    // Warn if selected role doesn't match actual role
    if (user.role !== selectedRole) {
      setError(
        `Note: You selected "${selectedRole}" but your account role is "${user.role}". You have been redirected accordingly.`
      );
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const { token, user } = await authenticateWithBackend(cred.user);
      login(token, user);
      handleRoute(user);
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const { token, user } = await authenticateWithBackend(cred.user);
      login(token, user);
      handleRoute(user);
    } catch (err: any) {
      setError(err.message || "Google authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 shadow-2xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/10 mb-2">
            <Shield className="h-6 w-6 text-blue-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Audit Monitoring System</CardTitle>
          <CardDescription className="text-slate-400">
            Secure access to analytics &amp; anomaly detection
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Role Selector */}
          <div className="space-y-2">
            <Label className="text-slate-300 text-xs uppercase tracking-wider">I am logging in as</Label>
            <div className="grid grid-cols-3 gap-2">
              {ROLE_OPTIONS.map(({ value, label, description, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedRole(value)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all duration-200 ${
                    selectedRole === value
                      ? "border-blue-500 bg-blue-600/15 text-blue-300"
                      : "border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-semibold">{label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Info className="h-3 w-3 shrink-0" />
              {ROLE_OPTIONS.find(r => r.value === selectedRole)?.description}. Your role is assigned by the system administrator.
            </p>
          </div>

          <hr className="border-slate-700" />

          {/* Email + Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                required
              />
            </div>

            {error && (
              <div className="text-sm font-medium text-red-400 text-center bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sign In as {ROLE_OPTIONS.find(r => r.value === selectedRole)?.label}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-800 px-2 text-slate-400">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-slate-700 bg-transparent text-white hover:bg-slate-700"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
            </svg>
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
