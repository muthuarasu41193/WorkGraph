"use client";

import { useCallback, useEffect, useState } from "react";
import { Brain, Sparkles } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { ResumeIntelligenceReport } from "@/lib/talent-intelligence/types";
import { apiErrorMessage, readApiJson, withSupabaseAuthHeaders } from "@/lib/api-fetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ResumeIntelligenceDashboard from "./ResumeIntelligenceDashboard";

type AnalyzeResponse =
  | { ok: true; reportId: string; cached: boolean; report: ResumeIntelligenceReport }
  | { ok: false; error?: string; code?: string };

type ReportSummary = {
  id: string;
  jobTitle: string | null;
  company: string | null;
  overallScore: number | null;
  createdAt: string;
};

type Props = {
  hasResume: boolean;
  initialJobDescription?: string;
  initialJobTitle?: string;
  initialCompany?: string;
  initialJobId?: string;
};

export default function ResumeIntelligenceSection({
  hasResume,
  initialJobDescription = "",
  initialJobTitle = "",
  initialCompany = "",
  initialJobId,
}: Props) {
  const [jobDescription, setJobDescription] = useState(initialJobDescription);
  const [jobTitle, setJobTitle] = useState(initialJobTitle);
  const [company, setCompany] = useState(initialCompany);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ResumeIntelligenceReport | null>(null);
  const [cached, setCached] = useState(false);
  const [history, setHistory] = useState<ReportSummary[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      const headers = await withSupabaseAuthHeaders();
      const res = await fetch("/api/talent-intelligence/reports?limit=10", { headers });
      const data = (await readApiJson(res)) as { ok: boolean; reports?: ReportSummary[] };
      if (data.ok && data.reports) setHistory(data.reports);
    } catch {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (initialJobDescription) setJobDescription(initialJobDescription);
    if (initialJobTitle) setJobTitle(initialJobTitle);
    if (initialCompany) setCompany(initialCompany);
  }, [initialJobDescription, initialJobTitle, initialCompany]);

  async function analyze(forceRefresh = false) {
    setLoading(true);
    setError(null);

    try {
      const headers = await withSupabaseAuthHeaders({ "Content-Type": "application/json" });
      const res = await fetch("/api/talent-intelligence/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify({
          jobDescription,
          jobTitle: jobTitle || undefined,
          company: company || undefined,
          jobId: initialJobId,
          forceRefresh,
        }),
      });
      const data = (await readApiJson(res)) as AnalyzeResponse;

      if (!res.ok || !data.ok) {
        setError(apiErrorMessage(data) ?? "Analysis failed.");
        return;
      }

      setReport(data.report);
      setCached(data.cached);
      void loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach analyzer.");
    } finally {
      setLoading(false);
    }
  }

  async function loadReport(id: string) {
    setLoading(true);
    setError(null);
    try {
      const headers = await withSupabaseAuthHeaders();
      const res = await fetch(`/api/talent-intelligence/reports/${id}`, { headers });
      const data = (await readApiJson(res)) as {
        ok: boolean;
        report?: { data: ResumeIntelligenceReport };
      };
      if (data.ok && data.report?.data) {
        setReport(data.report.data);
        setCached(true);
      }
    } catch {
      setError("Failed to load saved report.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-5" aria-labelledby="resume-intelligence-heading">
      <header>
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <h1 id="resume-intelligence-heading" className="text-heading-l">
            Resume Intelligence
          </h1>
        </div>
        <p className="mt-1 text-body text-muted-foreground">
          Compare your genuine experience against any job. WorkGraph explains fit, gaps, and improvements — never fabricates content.
        </p>
      </header>

      {!hasResume ? (
        <Alert variant="destructive">
          <AlertDescription>
            Upload your resume first via Profile or Upload. Resume Intelligence uses your stored resume — it will not invent experience.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="wg-dash-section-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-heading-s">
            <Sparkles className="h-5 w-5 text-primary" />
            Analyze against a job
          </CardTitle>
          <CardDescription>
            Paste a job description from any source, or analyze from a job card in your feed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ti-job-title">Job title (optional)</Label>
              <Input
                id="ti-job-title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Senior Software Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ti-company">Company (optional)</Label>
              <Input
                id="ti-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corp"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ti-jd">Job description</Label>
            <Textarea
              id="ti-jd"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here…"
              rows={8}
              className="min-h-[160px] resize-y"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => analyze(false)}
              disabled={loading || !hasResume || jobDescription.trim().length < 80}
            >
              {loading ? <Spinner className="mr-2" /> : null}
              Analyze Resume
            </Button>
            {report ? (
              <Button variant="outline" onClick={() => analyze(true)} disabled={loading}>
                Re-run analysis
              </Button>
            ) : null}
          </div>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      {history.length > 0 && !report ? (
        <Card className="wg-dash-section-card">
          <CardHeader>
            <CardTitle className="text-body-lg">Recent analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {history.map((h) => (
                <li key={h.id}>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => loadReport(h.id)}
                    className="h-auto w-full justify-between px-3 py-2 text-left text-body font-normal"
                  >
                    <span>
                      {h.jobTitle ?? "Untitled role"}
                      {h.company ? ` · ${h.company}` : ""}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {h.overallScore ?? "—"}% · {new Date(h.createdAt).toLocaleDateString()}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {report ? <ResumeIntelligenceDashboard report={report} cached={cached} /> : null}
    </section>
  );
}
