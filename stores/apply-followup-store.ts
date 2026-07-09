"use client";

import { create } from "zustand";

export type ApplyFollowupJob = {
  jobId: string;
  company: string;
  title: string;
  applyUrl: string;
  source?: string;
};

type ApplyFollowupState = {
  active: ApplyFollowupJob | null;
  timeoutId: ReturnType<typeof setTimeout> | null;
  schedule: (job: ApplyFollowupJob, delayMs?: number) => void;
  dismiss: () => void;
};

export const useApplyFollowupStore = create<ApplyFollowupState>((set, get) => ({
  active: null,
  timeoutId: null,
  schedule: (job, delayMs = 45_000) => {
    const prev = get().timeoutId;
    if (prev) clearTimeout(prev);

    const timeoutId = setTimeout(() => {
      set({ active: job, timeoutId: null });
    }, delayMs);

    set({ timeoutId, active: null });
  },
  dismiss: () => {
    const prev = get().timeoutId;
    if (prev) clearTimeout(prev);
    set({ active: null, timeoutId: null });
  },
}));
