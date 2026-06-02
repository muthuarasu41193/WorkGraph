"use client";

import { useMemo, useState } from "react";
import { FileText, Loader2, UploadCloud } from "lucide-react";
import { useDropzone } from "react-dropzone";
import AIWarningBanner from "@/app/(dashboard)/profile/components/AIWarningBanner";
import AnalysisResults, { type ResumeAnalysis } from "@/app/(dashboard)/profile/components/AnalysisResults";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type AnalyzeResponse =
  | { ok: true; analysis: ResumeAnalysis }
  | { ok: false; error?: string };

export default function ResumeAnalyzer() {
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);

  const onDrop = (accepted: File[]) => {
    setError(null);
    setAnalysis(null);
    setFile(accepted[0] ?? null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    onDrop,
  });

  const canAnalyze = useMemo(() => {
    if (loading) return false;
    if (mode === "upload") return Boolean(file);
    return resumeText.trim().length >= 120;
  }, [loading, mode, file, resumeText]);

  async function analyzeResume() {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const formData = new FormData();
      if (mode === "upload" && file) formData.append("file", file);
      if (mode === "paste") formData.append("resumeText", resumeText);
      if (targetRole.trim()) formData.append("targetRole", targetRole.trim());
      if (jobDescription.trim()) formData.append("jobDescription", jobDescription.trim());

      const response = await fetch("/api/resume/analyze", {
        method: "POST",
        body: formData,
      });
      const json = (await response.json()) as AnalyzeResponse;

      if (!response.ok || !json.ok) {
        setError((json as { error?: string }).error ?? "Analysis failed.");
        return;
      }
      setAnalysis(json.analysis);
    } catch {
      setError("Could not reach analyzer. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="wg-dash-section-card">
      <CardHeader>
        <CardTitle className="text-lg">AI Resume Analyzer</CardTitle>
        <CardDescription>
          Advisory-only feedback for ATS readiness. Your resume is never auto-modified.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AIWarningBanner />

        <Tabs value={mode} onValueChange={(value) => setMode(value as "upload" | "paste")}>
          <TabsList>
            <TabsTrigger value="upload">Upload PDF</TabsTrigger>
            <TabsTrigger value="paste">Paste Text</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="space-y-3">
            <div
              {...getRootProps()}
              className={`cursor-pointer rounded-lg border border-dashed p-6 text-center transition-colors ${
                isDragActive ? "border-primary bg-primary/5" : "border-border bg-muted/20 hover:bg-muted/30"
              }`}
            >
              <input {...getInputProps()} />
              <UploadCloud className="mx-auto h-7 w-7 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">
                {file ? `Selected: ${file.name}` : "Drag and drop your PDF resume"}
              </p>
              <p className="text-xs text-muted-foreground">or click to select a file</p>
            </div>
          </TabsContent>
          <TabsContent value="paste" className="space-y-2">
            <Label htmlFor="resume-text">Resume text</Label>
            <Textarea
              id="resume-text"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={12}
              placeholder="Paste your resume text here..."
            />
          </TabsContent>
        </Tabs>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="target-role">Target Role (optional)</Label>
            <Input
              id="target-role"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="job-description">Job Description (optional)</Label>
            <Textarea
              id="job-description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={6}
              placeholder="Paste a job description for role-specific match scoring..."
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" onClick={analyzeResume} disabled={!canAnalyze}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Analyze
          </Button>
          <p className="text-xs text-muted-foreground">Suggestions only — no automatic resume edits.</p>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
            <Skeleton className="h-56 w-full" />
          </div>
        ) : null}

        {!loading && analysis ? <AnalysisResults analysis={analysis} /> : null}
      </CardContent>
    </Card>
  );
}

