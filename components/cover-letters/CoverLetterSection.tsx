"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, Sparkles } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import { apiErrorMessage, readApiJson, withSupabaseAuthHeaders } from "@/lib/api-fetch";
import { LIMITS } from "@/lib/validation/primitives";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SavedCoverLetterCard from "./SavedCoverLetterCard";

const JOB_DESCRIPTION_MAX = 2000;

type SavedLetterSummary = {
  id: string;
  job_title: string;
  company: string;
  created_at: string;
};

type Props = {
  hasResume: boolean;
};

export function CoverLetterSection({ hasResume }: Props) {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [letter, setLetter] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [savedLetters, setSavedLetters] = useState<SavedLetterSummary[]>([]);

  const loadSaved = useCallback(async () => {
    setListError(null);
    try {
      const headers = await withSupabaseAuthHeaders();
      const res = await fetch("/api/cover-letters/list", { headers });
      const data = (await readApiJson(res)) as { letters?: SavedLetterSummary[] };
      if (!res.ok) {
        setListError(apiErrorMessage(data) ?? "Could not load your cover letters.");
        return;
      }
      setSavedLetters(Array.isArray(data.letters) ? data.letters : []);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Could not load your cover letters.");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSaved();
  }, [loadSaved]);

  const canGenerate =
    hasResume &&
    jobTitle.trim().length > 0 &&
    company.trim().length > 0 &&
    jobDescription.trim().length > 0 &&
    !generating;

  async function generate() {
    setGenerating(true);
    setError(null);
    setSavedId(null);
    try {
      const headers = await withSupabaseAuthHeaders({ "Content-Type": "application/json" });
      const res = await fetch("/api/cover-letters/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          jobTitle: jobTitle.trim(),
          company: company.trim(),
          jobDescription: jobDescription.trim(),
        }),
      });
      const data = (await readApiJson(res)) as { letter?: string };
      if (!res.ok || typeof data.letter !== "string" || !data.letter.trim()) {
        setError(apiErrorMessage(data) ?? "Could not generate a cover letter.");
        return;
      }
      setLetter(data.letter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate a cover letter.");
    } finally {
      setGenerating(false);
    }
  }

  async function saveLetter() {
    if (!letter?.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const headers = await withSupabaseAuthHeaders({ "Content-Type": "application/json" });
      const res = await fetch("/api/cover-letters/save", {
        method: "POST",
        headers,
        body: JSON.stringify({
          jobTitle: jobTitle.trim(),
          company: company.trim(),
          jobDescription: jobDescription.trim() || undefined,
          letter,
        }),
      });
      const data = (await readApiJson(res)) as { id?: string };
      if (!res.ok || typeof data.id !== "string") {
        setError(apiErrorMessage(data) ?? "Could not save your cover letter.");
        return;
      }
      setSavedId(data.id);
      toast({ title: "Cover letter saved", variant: "success" });
      void loadSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your cover letter.");
    } finally {
      setSaving(false);
    }
  }

  async function copyLetter() {
    if (!letter) return;
    try {
      await navigator.clipboard.writeText(letter);
      toast({ title: "Copied cover letter", variant: "success" });
    } catch {
      toast({
        title: "Copy failed",
        description: "Clipboard permission was blocked. Select the letter and copy it manually.",
        variant: "error",
      });
    }
  }

  return (
    <section className="space-y-8" aria-labelledby="cover-letters-heading">
      <header>
        <div className="flex items-center gap-2">
          <FileText className={iconClass("standalone", "text-primary")} />
          <h1 id="cover-letters-heading" className="text-2xl font-bold tracking-tight">
            Cover Letters
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Draft a letter from your stored resume for a specific role. Review it before sending — this is a starting point, not a hiring guarantee.
        </p>
      </header>

      {!hasResume ? (
        <Alert variant="destructive">
          <AlertDescription>
            Upload your resume first via Profile. Cover letters use your stored resume and will not invent experience.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="wg-dash-section-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate a cover letter
          </CardTitle>
          <CardDescription>
            Add the role and paste the job description. WorkGraph writes a 3–4 paragraph draft in your voice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cl-job-title">Job title</Label>
              <Input
                id="cl-job-title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Senior Software Engineer"
                maxLength={LIMITS.jobTitle}
                disabled={generating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cl-company">Company</Label>
              <Input
                id="cl-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corp"
                maxLength={LIMITS.company}
                disabled={generating}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="cl-jd">Job description</Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {jobDescription.length}/{JOB_DESCRIPTION_MAX}
              </span>
            </div>
            <Textarea
              id="cl-jd"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value.slice(0, JOB_DESCRIPTION_MAX))}
              placeholder="Paste the full job description here…"
              rows={8}
              maxLength={JOB_DESCRIPTION_MAX}
              className="min-h-[160px] resize-y"
              disabled={generating}
            />
          </div>
          <Button type="button" onClick={() => void generate()} disabled={!canGenerate} loading={generating}>
            Generate Cover Letter
          </Button>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      {letter ? (
        <Card className="wg-dash-section-card">
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-lg">Generated letter</CardTitle>
              <CardDescription>
                Draft for {jobTitle.trim() || "this role"}
                {company.trim() ? ` at ${company.trim()}` : ""}. Edit in your own editor before sending.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => void copyLetter()}>
                Copy
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void saveLetter()}
                disabled={Boolean(savedId)}
                loading={saving}
              >
                {savedId ? "Saved" : "Save"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-6">{letter}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="wg-dash-section-card">
        <CardHeader>
          <CardTitle className="text-base">Your Saved Cover Letters</CardTitle>
          <CardDescription>Letters you chose to keep. Delete anytime.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {listLoading ? (
            <p className="text-sm text-muted-foreground">Loading saved letters…</p>
          ) : listError ? (
            <Alert variant="destructive">
              <AlertDescription>{listError}</AlertDescription>
            </Alert>
          ) : savedLetters.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved cover letters yet.</p>
          ) : (
            <ul className="space-y-3">
              {savedLetters.map((item) => (
                <li key={item.id}>
                  <SavedCoverLetterCard
                    id={item.id}
                    jobTitle={item.job_title}
                    company={item.company}
                    createdAt={item.created_at}
                    onDelete={(deletedId) =>
                      setSavedLetters((current) => current.filter((row) => row.id !== deletedId))
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export default CoverLetterSection;
