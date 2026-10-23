"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AIWarningBanner() {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    <div className="rounded-lg border border-caution/80 bg-caution-wash/70 p-3 text-caution   ">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p className="text-sm leading-6">
          <span className="font-medium">Modern ATS systems are increasingly detecting AI-generated content.</span>{" "}
          We provide suggestions only — please edit your resume yourself using these insights to ensure it passes
          AI-detection ATS filters.
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="ml-auto h-7 w-7 shrink-0 text-caution hover:bg-caution-wash/60  "
          onClick={() => setOpen(false)}
          aria-label="Dismiss warning"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

