"use client";

import { toast as sonnerToast } from "sonner";

export type ToastVariant = "default" | "success" | "error";

export type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  undoLabel?: string;
  onUndo?: () => void;
};

/** @deprecated Prefer toast(); kept so older imports type-check during migration. */
export type ToastRecord = ToastInput & { id: string };

/**
 * Quiet toast API used across product surfaces.
 * Playbook: success auto-dismisses (~4s); errors persist with an action; Undo when reversible.
 */
export function toast(input: ToastInput) {
  const duration = input.variant === "error" ? Infinity : input.onUndo ? 5_000 : 4_000;
  const action = input.onUndo
    ? {
        label: input.undoLabel ?? "Undo",
        onClick: () => input.onUndo?.(),
      }
    : undefined;

  const options = {
    description: input.description,
    duration,
    action,
  };

  if (input.variant === "error") {
    return sonnerToast.error(input.title, options);
  }
  if (input.variant === "success") {
    return sonnerToast.success(input.title, options);
  }
  return sonnerToast(input.title, options);
}

/** Dismiss a toast by id (Sonner id) or all when omitted. */
export function dismissToast(id?: string | number) {
  sonnerToast.dismiss(id);
}
