import { create } from "zustand";
import { api } from "../lib/api";

export interface User {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  billingPlan: "FREE" | "PRO" | "ENTERPRISE";
  createdAt: string;
  profile?: {
    fullName: string;
    avatarUrl?: string;
    headline?: string;
    phone?: string;
    location?: string;
    summary?: string;
    completionPct: number;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.error("Logout error:", e);
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },
}));
