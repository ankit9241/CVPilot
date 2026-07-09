import { create } from "zustand";

interface UIState {
  commandMenuOpen: boolean;
  setCommandMenuOpen: (open: boolean) => void;
  toggleCommandMenu: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  commandMenuOpen: false,
  setCommandMenuOpen: (open) => set({ commandMenuOpen: open }),
  toggleCommandMenu: () => set((s) => ({ commandMenuOpen: !s.commandMenuOpen })),
}));
