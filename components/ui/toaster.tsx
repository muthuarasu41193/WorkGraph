"use client";

import { X } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";
import { motion } from "@/lib/motion";
import { useToastStore, type ToastVariant } from "@/hooks/use-toast";

const VARIANT_STYLES: Record<ToastVariant, string> = {
  default: "border-border bg-background text-foreground",
  success: "border-success/20 bg-success-subtle text-success-foreground dark:border-success/20 dark:bg-success-subtle/40 dark:text-success-foreground",
  error: "border-red-200 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100",
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
          className={cn(
            "pointer-events-auto rounded-lg border p-4 shadow-lg",
            motion.toast,
            VARIANT_STYLES[item.variant ?? "default"],
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-body font-semibold">{item.title}</p>
              {item.description ? (
                <p className="mt-1 text-body opacity-90">{item.description}</p>
              ) : null}
            </div>
            <IconButton
              type="button"
              variant="ghost"
              iconSize="sm"
              onClick={() => dismiss(item.id)}
              className="shrink-0 opacity-70 hover:opacity-100"
              label="Dismiss notification"
              icon={<X className="h-4 w-4" />}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
