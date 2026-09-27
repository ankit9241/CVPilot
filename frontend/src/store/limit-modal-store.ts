import { create } from "zustand";

export interface LimitModalData {
  feature?: string;
  title?: string;
  message?: string;
  used?: number;
  limit?: number;
  remaining?: number;
  resetAt?: string;
}

interface LimitModalState {
  isOpen: boolean;
  data: LimitModalData;
  openLimitModal: (data?: LimitModalData) => void;
  closeLimitModal: () => void;
}

export const useLimitModalStore = create<LimitModalState>((set) => ({
  isOpen: false,
  data: {},
  openLimitModal: (data = {}) =>
    set({
      isOpen: true,
      data,
    }),
  closeLimitModal: () =>
    set({
      isOpen: false,
      data: {},
    }),
}));
