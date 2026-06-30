"use client";

import { useState } from "react";
import { Brain, Loader2 } from "lucide-react";
import type { ResumeIntelligenceReport } from "@/lib/talent-intelligence/types";
import { apiErrorMessage, readApiJson, withSupabaseAuthHeaders } from "@/lib/api-fetch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ResumeIntelligenceDashboard from "./ResumeIntelligenceDashboard";

type Props = {
  jobId?: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
  hasResume: boolean;
  triggerClassName?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
};

export default function ResumeIntelligenceDialog({
  jobId,
  jobTitle,
  company,
  jobDescription,
  hasResume,
  triggerClassName,
  variant = "outline",
  size = "sm",
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ResumeIntelligenceReport | null>(null);
  const [cached, setCached] = useState(false);

  async function runAnalysis() {
    if (!hasResume) {
      setError("Upload your resume first to use Resume Intelligence.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers = await withSupabaseAuthHeaders({ "Content-Type": "application/json" });
      const res = await fetch("/api/talent-intelligence/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify({
          jobDescription,
          jobTitle,
          company,
          jobId,
        }),
      });
      const data = (await readApiJson(res)) as {
        ok: boolean;
        report?: ResumeIntelligenceReport;
        cached?: boolean;
      };

      if (!res.ok || !data.ok || !data.report) {
        setError(apiErrorMessage(data) ?? "Analysis failed.");
        return;
      }

      setReport(data.report);
      setCached(Boolean(data.cached));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && !report && hasResume) {
      void runAnalysis();
    }
    if (!next) {
      setError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          className={triggerClassName}
          onClick={(e) => e.stopPropagation()}
        >
          <Brain className="mr-1.5 h-4 w-4" />
          Analyze Resume
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl gap-0 p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Resume Intelligence
          </DialogTitle>
          <DialogDescription>
            {jobTitle} at {company} — honest fit analysis using your real experience.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-5rem)] px-6 py-4">
          {!hasResume ? (
            <Alert variant="destructive">
              <AlertDescription>
                Upload your resume via Profile or Upload before analyzing.
              </AlertDescription>
            </Alert>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Analyzing your resume against this role…</p>
              <p className="text-xs">This may take up to a minute.</p>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : report ? (
            <ResumeIntelligenceDashboard report={report} cached={cached} />
          ) : null}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
