"use client";

import { useMemo, useState } from "react";
import { CheckCircle, Lightbulb, Loader2, XCircle } from "lucide-react";
import type { ATSFeedback } from "../../lib/types";

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
    if (currentScore >= 80) return "#10B981";
    if (currentScore >= 60) return "#F59E0B";
    return "#EF4444";
  }, [currentScore]);

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ats-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to analyze resume.");
      setLocalFeedback({
        score: json.score,
        grade: json.grade,
        strengths: json.strengths ?? [],
        weaknesses: json.weaknesses ?? [],
        suggestions: json.suggestions ?? [],
        keyword_density: json.keyword_density ?? "low",
        formatting_score: json.formatting_score ?? 0,
        content_score: json.content_score ?? 0,
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
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-[#111827]">ATS Score</h2>

      {localFeedback || score !== null ? (
        <>
          <div className="mx-auto mb-4 flex w-fit flex-col items-center">
            <div className="relative h-36 w-36">
              <svg className="-rotate-90" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="10" />
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
                <p className="text-3xl font-bold text-[#111827]">{currentScore}</p>
                <p className="text-sm font-semibold text-[#6B7280]">{grade}</p>
              </div>
            </div>
          </div>

          <div className="mb-3 flex rounded-lg border border-[#E5E7EB] p-1">
            {(["strengths", "weaknesses", "suggestions"] as Tab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium capitalize ${
                  activeTab === tab ? "bg-[#7C3AED] text-white" : "text-[#6B7280]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <ul className="space-y-2">
            {tabItems.length ? (
              tabItems.map((item, idx) => (
                <li key={`${item}-${idx}`} className="flex items-start gap-2 text-sm text-[#6B7280]">
                  {activeTab === "strengths" ? (
                    <CheckCircle className="mt-0.5 h-4 w-4 text-[#10B981]" />
                  ) : activeTab === "weaknesses" ? (
                    <XCircle className="mt-0.5 h-4 w-4 text-[#EF4444]" />
                  ) : (
                    <Lightbulb className="mt-0.5 h-4 w-4 text-[#7C3AED]" />
                  )}
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className="text-sm text-[#9CA3AF]">No analysis points available.</li>
            )}
          </ul>
        </>
      ) : (
        <button
          type="button"
          onClick={() => void analyze()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Analyzing..." : "Analyze My Resume"}
        </button>
      )}
    </section>
  );
}
