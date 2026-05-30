"use client";

import { create } from "zustand";

export type ToastVariant = "default" | "success" | "error";

export type ToastRecord = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastState = {
  toasts: ToastRecord[];
  push: (toast: Omit<ToastRecord, "id">) => void;
  dismiss: (id: string) => void;
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4200);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export function toast(input: Omit<ToastRecord, "id">) {
  useToastStore.getState().push(input);
}
