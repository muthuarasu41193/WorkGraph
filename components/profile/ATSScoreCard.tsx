"use client";

import { useMemo, useState } from "react";
import { CheckCircle, Lightbulb, Loader2, XCircle } from "lucide-react";
import type { ATSFeedback } from "../../lib/types";
import { apiErrorMessage, readApiJson } from "../../lib/api-fetch";

type Tab = "strengths" | "weaknesses" | "suggestions";

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
  const [activeTab, setActiveTab] = useState<Tab>("strengths");
  const [loading, setLoading] = useState(false);
  const [localFeedback, setLocalFeedback] = useState<ATSFeedback | null>(feedback);

  const currentScore = localFeedback?.score ?? score ?? 0;
  const grade = localFeedback?.grade ?? gradeFromScore(currentScore);

  const ringColor = useMemo(() => {
    if (currentScore >= 80) return "#1E8E3E";
    if (currentScore >= 60) return "#F9AB00";
    return "#D93025";
  }, [currentScore]);

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ats-score", {
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
    <section id="ats-score" className="scroll-mt-28 rounded-xl border border-[#DADCE0] bg-[#FFFFFF] p-6">
      <h2 className="mb-1 text-[18px] font-semibold text-[#2C2C2E]">ATS Score</h2>
      <p className="mb-4 text-xs font-normal text-[#8E8E93]">Your parsed resume quality and action points.</p>

      {localFeedback || score !== null ? (
        <>
          <div className="mx-auto mb-4 flex w-fit flex-col items-center">
            <div className="relative h-36 w-36">
              <svg className="-rotate-90" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r={radius} fill="none" stroke="#DADCE0" strokeWidth="10" />
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
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-bold text-[#1D1D1F]">{currentScore}</p>
                <p className="text-sm font-medium text-[#8E8E93]">{grade}</p>
              </div>
            </div>
          </div>

          <div className="mb-3 flex rounded-lg border border-[#DADCE0] p-1" role="tablist" aria-label="ATS analysis tabs">
            {(["strengths", "weaknesses", "suggestions"] as Tab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                role="tab"
                aria-selected={activeTab === tab}
                aria-controls={`ats-tabpanel-${tab}`}
                id={`ats-tab-${tab}`}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A73E8] focus-visible:ring-offset-2 ${
                  activeTab === tab ? "bg-[#1A73E8] text-white" : "text-[#3A3A3C]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <ul
            className="space-y-2"
            role="tabpanel"
            id={`ats-tabpanel-${activeTab}`}
            aria-labelledby={`ats-tab-${activeTab}`}
            aria-live="polite"
          >
            {tabItems.length ? (
              tabItems.map((item, idx) => (
                <li key={`${item}-${idx}`} className="flex items-start gap-2 text-sm font-normal text-[#3A3A3C]">
                  {activeTab === "strengths" ? (
                    <CheckCircle className="mt-0.5 h-4 w-4 text-[#1E8E3E]" />
                  ) : activeTab === "weaknesses" ? (
                    <XCircle className="mt-0.5 h-4 w-4 text-[#D93025]" />
                  ) : (
                    <Lightbulb className="mt-0.5 h-4 w-4 text-[#1A73E8]" />
                  )}
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className="text-sm font-normal text-[#8E8E93]">No analysis points available.</li>
            )}
          </ul>
        </>
      ) : (
        <button
          type="button"
          onClick={() => void analyze()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1A73E8] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1557B0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A73E8] focus-visible:ring-offset-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Analyzing..." : "Analyze My Resume"}
        </button>
      )}
    </section>
  );
}
