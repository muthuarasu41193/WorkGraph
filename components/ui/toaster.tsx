"use client";

import type { ReactNode } from "react";
import { AlertCircle, Check, X } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import { cn } from "@/lib/utils";
import { FOCUS_RING } from "@/lib/focus-ring";
import { useToastStore, type ToastVariant } from "@/hooks/use-toast";

const VARIANT_ICON: Record<ToastVariant, ReactNode> = {
  default: (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-positive-wash text-positive">
      <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
    </span>
  ),
  success: (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-positive-wash text-positive">
      <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
    </span>
  ),
  error: (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-danger-wash text-danger">
      <AlertCircle className="size-3.5" strokeWidth={2.25} aria-hidden />
    </span>
  ),
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      className="pointer-events-none fixed bottom-20 right-4 z-toast flex w-full max-w-sm flex-col gap-2 md:bottom-6"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          role="status"
          className="wg-toast pointer-events-auto flex items-start gap-3 border border-hairline bg-surface-raised p-3.5 shadow-lg"
          style={{ borderRadius: 10 }}
        >
          {item.variant === "error" ? VARIANT_ICON.error : VARIANT_ICON.success}
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-role-caption font-medium text-ink">{item.title}</p>
            {item.description ? (
              <p className="mt-0.5 text-role-caption text-ink-subtle">{item.description}</p>
            ) : null}
            {item.onUndo ? (
              <button
                type="button"
                className="mt-2 inline-flex min-h-11 items-center text-role-caption text-accent"
                onClick={() => {
                  item.onUndo?.()
                  dismiss(item.id)
                }}
              >
                {item.undoLabel ?? "Undo"}
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => dismiss(item.id)}
            className={cn(
              "shrink-0 rounded-md p-1 text-ink-subtle transition-colors duration-base ease-exit hover:text-ink ",
              FOCUS_RING,
            )}
            aria-label="Dismiss notification"
          >
            <X className={iconClass()} />
          </button>
        </div>
      ))}
    </div>
  );
}
