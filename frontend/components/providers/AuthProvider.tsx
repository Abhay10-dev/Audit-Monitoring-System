"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AppUser {
  id: string;
  email: string;
  displayName?: string;
  role: "admin" | "manager" | "employee";
  sessionId?: string;
}

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (token: string, userData: AppUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Listen for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        // If we have a Firebase user but no AppUser, we try to restore session
        // In a real app we might fetch user details from /api/auth/me here
        // For now, we rely on the explicit login method being called after login
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (token: string, userData: AppUser) => {
    // Store token securely (e.g. secure HttpOnly cookie in prod)
    // For MVP, we'll keep it in memory / localStorage
    localStorage.setItem("ams_token", token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      if (user?.sessionId) {
        // Notify backend to close session
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("ams_token")}`,
          },
          body: JSON.stringify({ sessionId: user.sessionId }),
        }).catch(console.error); // Fire and forget
      }

      await auth.signOut();
      localStorage.removeItem("ams_token");
      setUser(null);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
