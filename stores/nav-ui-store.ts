import { create } from "zustand";
import type { NavFeedbackKind, NavFeedbackRoute } from "@/lib/nav-feedback-events";

type SuccessState = Partial<Record<NavFeedbackRoute, NavFeedbackKind>>;

type NavUiState = {
  pendingRoute: string | null;
  successState: SuccessState;
  setPendingRoute: (route: string | null) => void;
  triggerSuccess: (route: NavFeedbackRoute, kind: NavFeedbackKind) => void;
  clearSuccess: (route: NavFeedbackRoute) => void;
};

const SUCCESS_DURATION_MS: Record<NavFeedbackKind, number> = {
  glow: 1500,
  pulse: 600,
  check: 2500,
};

export const useNavUiStore = create<NavUiState>((set, get) => ({
  pendingRoute: null,
  successState: {},
  setPendingRoute: (route) => set({ pendingRoute: route }),
  triggerSuccess: (route, kind) => {
    set((state) => ({
      successState: { ...state.successState, [route]: kind },
    }));
    window.setTimeout(() => {
      if (get().successState[route] === kind) {
        get().clearSuccess(route);
      }
    }, SUCCESS_DURATION_MS[kind]);
  },
  clearSuccess: (route) =>
    set((state) => {
      const next = { ...state.successState };
      delete next[route];
      return { successState: next };
    }),
}));
