import { create } from "zustand";
import { api, AuthExpiredError } from "../lib/api";

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
  initialize: () => Promise<void>;
  handleSessionExpired: () => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
}

let initialized = false;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  initialize: async () => {
    if (initialized) return;
    initialized = true;
    set({ isLoading: true });
    try {
      const user = await api.get<User>("/auth/me");
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
  handleSessionExpired: () => {
    set({ user: null, isAuthenticated: false, isLoading: false });
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.assign("/login");
    }
  },
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
      window.location.href = "/";
    }
  },
}));

// Hook the api layer's hard-session-expiry signal into the store.
api.onAuthExpired = () => useAuthStore.getState().handleSessionExpired();
