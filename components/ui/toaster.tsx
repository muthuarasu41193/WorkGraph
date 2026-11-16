"use client";

import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/components/theme/ThemeProvider";

/**
 * App-wide toast host. Styled to Ledger tokens (hairline, paper surface, ink).
 * Call sites keep using toast() from @/hooks/use-toast.
 */
export function Toaster() {
  const { resolved } = useTheme();

  return (
    <Sonner
      theme={resolved}
      position="bottom-right"
      closeButton
      richColors={false}
      className="toaster z-toast"
      offset={{ bottom: "5.5rem", right: "1rem" }}
      mobileOffset={{ bottom: "5.5rem", right: "1rem" }}
      toastOptions={{
        classNames: {
          toast:
            "group toast border border-hairline bg-surface-raised text-ink shadow-overlay !rounded-[10px] !gap-3",
          title: "text-role-caption font-medium text-ink",
          description: "text-role-caption text-ink-subtle",
          actionButton:
            "bg-transparent text-accent text-role-caption font-medium hover:underline !h-auto !px-0 !py-0",
          cancelButton: "bg-surface-sunken text-ink-muted",
          closeButton:
            "border-hairline bg-surface-raised text-ink-subtle hover:text-ink hover:bg-surface-sunken",
          success: "!border-hairline !bg-surface-raised !text-ink",
          error: "!border-hairline !bg-surface-raised !text-ink",
        },
      }}
    />
  );
}
