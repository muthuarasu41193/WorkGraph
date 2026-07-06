"use client";

import { useMemo, useState } from "react";
import { CheckCircle, Lightbulb, XCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { ATSFeedback } from "../../lib/types";
import { apiErrorMessage, readApiJson } from "../../lib/api-fetch";
import { atsScorePath } from "../../lib/workgraph-api-routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props = {
  userId: string;
  score: number | null;
  feedback: ATSFeedback | null;
};

function gradeFromScore(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export default function ATSScoreCard({ userId, score, feedback }: Props) {
  const [activeTab, setActiveTab] = useState<"strengths" | "weaknesses" | "suggestions">("strengths");
  const [loading, setLoading] = useState(false);
  const [localFeedback, setLocalFeedback] = useState<ATSFeedback | null>(feedback);

  const currentScore = localFeedback?.score ?? score ?? 0;
  const grade = localFeedback?.grade ?? gradeFromScore(currentScore);

  const ringColor = useMemo(() => {
    if (currentScore >= 80) return "var(--success)";
    if (currentScore >= 60) return "var(--warning)";
    return "var(--danger)";
  }, [currentScore]);

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await fetch(atsScorePath(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ user_id: userId }),
      });
      const json = await readApiJson(res);
      const payload = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
      if (!res.ok) throw new Error(apiErrorMessage(payload) || "Failed to analyze resume.");

      const num = (v: unknown) => {
        const n = typeof v === "number" ? v : Number(v);
        return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 0;
      };
      const list = (v: unknown): string[] =>
        Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

      setLocalFeedback({
        score: num(payload.score),
        grade:
          typeof payload.grade === "string" && ["A", "B", "C", "D", "F"].includes(payload.grade.toUpperCase())
            ? (payload.grade.toUpperCase() as ATSFeedback["grade"])
            : "F",
        strengths: list(payload.strengths),
        weaknesses: list(payload.weaknesses),
        suggestions: list(payload.suggestions),
        keyword_density:
          typeof payload.keyword_density === "string" &&
          ["low", "medium", "high"].includes(payload.keyword_density.toLowerCase())
            ? (payload.keyword_density.toLowerCase() as ATSFeedback["keyword_density"])
            : "low",
        formatting_score: num(payload.formatting_score),
        content_score: num(payload.content_score),
      });
    } catch {
      // keep UI simple if API fails
    } finally {
      setLoading(false);
    }
  };

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (currentScore / 100) * circumference;

  const tabItems =
    activeTab === "strengths"
      ? localFeedback?.strengths ?? []
      : activeTab === "weaknesses"
        ? localFeedback?.weaknesses ?? []
        : localFeedback?.suggestions ?? [];

  return (
    <Card id="ats-score" className="scroll-mt-32 border-border shadow-sm transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-heading-s">ATS Score</CardTitle>
        <CardDescription>Your parsed resume quality and action points.</CardDescription>
      </CardHeader>
      <CardContent>
        {localFeedback || score !== null ? (
          <>
            <div className="mx-auto mb-4 flex w-fit flex-col items-center">
              <div className="relative h-36 w-36">
                <svg className="-rotate-90" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-[stroke-dashoffset] duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-heading-xl text-foreground">{currentScore}</p>
                  <p className="text-body font-medium text-muted-foreground">{grade}</p>
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="mb-3 w-full">
                <TabsTrigger value="strengths" className="flex-1 capitalize">
                  Strengths
                </TabsTrigger>
                <TabsTrigger value="weaknesses" className="flex-1 capitalize">
                  Weaknesses
                </TabsTrigger>
                <TabsTrigger value="suggestions" className="flex-1 capitalize">
                  Suggestions
                </TabsTrigger>
              </TabsList>
              {(["strengths", "weaknesses", "suggestions"] as const).map((tab) => (
                <TabsContent key={tab} value={tab}>
                  <ul className="space-y-2" aria-live="polite">
                    {(tab === activeTab ? tabItems : []).length ? (
                      tabItems.map((item, idx) => (
                        <li key={`${item}-${idx}`} className="flex items-start gap-2 text-body text-muted-foreground">
                          {tab === "strengths" ? (
                            <CheckCircle className="mt-1 h-4 w-4 shrink-0 text-success" />
                          ) : tab === "weaknesses" ? (
                            <XCircle className="mt-1 h-4 w-4 shrink-0 text-destructive" />
                          ) : (
                            <Lightbulb className="mt-1 h-4 w-4 shrink-0 text-primary" />
                          )}
                          <span>{item}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-body text-muted-foreground">No analysis points available.</li>
                    )}
                  </ul>
                </TabsContent>
              ))}
            </Tabs>
          </>
        ) : (
          <Button type="button" onClick={() => void analyze()} disabled={loading}>
            {loading ? <Spinner /> : null}
            {loading ? "Analyzing..." : "Analyze My Resume"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
