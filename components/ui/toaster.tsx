"use client";

import type { ReactNode } from "react";
import { AlertCircle, Check, X } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import { cn } from "@/lib/utils";
import { FOCUS_RING } from "@/lib/focus-ring";
import { useToastStore, type ToastVariant } from "@/hooks/use-toast";

const VARIANT_ICON: Record<ToastVariant, ReactNode> = {
  default: (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
      <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
    </span>
  ),
  success: (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
      <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
    </span>
  ),
  error: (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
      <AlertCircle className="size-3.5" strokeWidth={2.25} aria-hidden />
    </span>
  ),
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      className="pointer-events-none fixed bottom-20 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 md:bottom-6"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          role="status"
          className="wg-toast pointer-events-auto flex items-start gap-3 border border-slate-200 bg-white p-3.5 shadow-lg dark:border-slate-700 dark:bg-slate-900"
          style={{ borderRadius: 10 }}
        >
          {item.variant === "error" ? VARIANT_ICON.error : VARIANT_ICON.success}
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[13px] font-medium text-slate-700 dark:text-slate-200">{item.title}</p>
            {item.description ? (
              <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">{item.description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => dismiss(item.id)}
            className={cn(
              "shrink-0 rounded-md p-1 text-slate-400 transition-colors duration-150 ease-out hover:text-slate-700 dark:hover:text-slate-200",
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
