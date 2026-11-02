"use client";

import { useState } from "react";
import Link from "next/link";
import { apiErrorMessage, readApiJson, withSupabaseAuthHeaders } from "@/lib/api-fetch";
import {
  parseTailoringLimitPayload,
  tailoringLimitNotice,
} from "@/lib/subscription/limit-notice";
import { PASS_UPGRADE_LABEL, upgradeHrefFromPayload } from "@/lib/subscription/upgrade";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { AIProvenance } from "@/components/product/AIProvenance";

type Suggestion = {
  sourceId: string;
  rewrite: string;
  jobRequirement: string;
  sourceText: string;
};

type Gap = {
  requirement: string;
  tip: string;
};

type TailoringResponse = {
  suggestions?: Suggestion[];
  gaps?: Gap[];
  rejectedCount?: number;
  privacy?: string;
  error?: string;
};

export function JobTailoringPanel({
  jobId,
  userId,
}: {
  jobId: string;
  userId: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [privacy, setPrivacy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upgradeHref, setUpgradeHref] = useState<string | null>(null);
  const [limitNotice, setLimitNotice] = useState<string | null>(null);

  async function runTailoring() {
    if (!userId) {
      window.location.href = `/login?next=/jobs/${encodeURIComponent(jobId)}`;
      return;
    }
    setLoading(true);
    setError(null);
    setUpgradeHref(null);
    setLimitNotice(null);
    setSuggestions(null);
    setGaps([]);
    setPrivacy(null);
    try {
      const headers = await withSupabaseAuthHeaders({ "Content-Type": "application/json" });
      const res = await fetch("/api/tailoring", {
        method: "POST",
        headers,
        body: JSON.stringify({ jobId }),
      });
      const data = (await readApiJson(res)) as TailoringResponse;
      if (res.status === 402) {
        const notice = parseTailoringLimitPayload(data);
        if (notice) {
          setLimitNotice(tailoringLimitNotice(notice.limit, notice.resetsAt));
          setUpgradeHref(upgradeHrefFromPayload(data));
          return;
        }
      }
      if (!res.ok) {
        setError(apiErrorMessage(data) ?? "Could not tailor your resume for this job.");
        return;
      }
      const nextSuggestions = Array.isArray(data.suggestions)
        ? data.suggestions.filter(
            (item): item is Suggestion =>
              !!item &&
              typeof item.sourceId === "string" &&
              typeof item.rewrite === "string" &&
              typeof item.sourceText === "string",
          )
        : [];
      const nextGaps = Array.isArray(data.gaps)
        ? data.gaps.filter(
            (item): item is Gap =>
              !!item && typeof item.requirement === "string" && typeof item.tip === "string",
          )
        : [];
      setSuggestions(nextSuggestions);
      setGaps(nextGaps);
      setPrivacy(
        typeof data.privacy === "string" && data.privacy.trim()
          ? data.privacy.trim()
          : "Tailoring sends your resume text and this job description to Groq (the existing AI processor). Results are not stored — copy what you want.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not tailor your resume for this job.");
    } finally {
      setLoading(false);
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", variant: "success" });
    } catch {
      toast({ title: "Could not copy", variant: "error" });
    }
  }

  return (
    <section className="mt-8 space-y-3" aria-labelledby="job-tailoring-heading">
      <Text as="h3" role="subheading" id="job-tailoring-heading">
        Tailor for this job
      </Text>
      <Text role="body-small" className="text-ink-muted">
        Opt-in rewrite of lines already on your resume. Each suggestion is checked against your
        source text. Missing requirements are listed as gaps — add them only if true.
      </Text>
      <Text role="caption" className="text-ink-subtle">
        Sends your resume text and this job description to Groq (the existing AI processor). Results
        are not stored.
      </Text>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={loading}
          onClick={() => void runTailoring()}
        >
          {loading ? "Tailoring…" : "Tailor for this job"}
        </Button>
        {!userId ? (
          <Text role="caption" className="text-ink-muted">
            Sign in to run tailoring.
          </Text>
        ) : null}
      </div>

      {limitNotice ? (
        <div className="space-y-2 rounded-card border border-hairline bg-surface p-3">
          <Text role="body-small">{limitNotice}</Text>
          {upgradeHref ? (
            <Link href={upgradeHref} className="inline-flex min-h-11 items-center text-accent">
              {PASS_UPGRADE_LABEL}
            </Link>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <Text role="body-small" className="text-ink-muted">
          {error}
        </Text>
      ) : null}

      {suggestions ? (
        <div className="space-y-4">
          {suggestions.length === 0 ? (
            <Text role="body-small">
              No verified rewrites survived the evidence check. Review the gaps below — add anything
              only if it is true.
            </Text>
          ) : (
            <ul className="space-y-4">
              {suggestions.map((item) => (
                <li key={`${item.sourceId}-${item.rewrite.slice(0, 24)}`} className="space-y-2">
                  <Text role="body">{item.rewrite}</Text>
                  <Text role="body-small" className="text-ink-muted">
                    From your resume: {item.sourceText}
                  </Text>
                  {item.jobRequirement ? (
                    <Text role="caption" className="text-ink-subtle">
                      Emphasises: {item.jobRequirement}
                    </Text>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    onClick={() => void copyText(item.rewrite)}
                  >
                    Copy
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {gaps.length > 0 ? (
            <div className="space-y-2">
              <Text as="h4" role="body" className="font-medium">
                Gaps (add only if true)
              </Text>
              <ul className="space-y-2">
                {gaps.map((gap) => (
                  <li key={gap.requirement} className="space-y-1">
                    <Text role="body-small">{gap.requirement}</Text>
                    <Text role="caption" className="text-ink-muted">
                      {gap.tip}
                    </Text>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <Text role="caption" className="text-ink-subtle">
            Suggestions use only your resume. Review before sending.
          </Text>
          {privacy ? (
            <AIProvenance
              label="Privacy"
              summary="Resume text and the job description go to Groq. Results are not stored."
              href="/legal/privacy"
              hrefLabel="Privacy policy"
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
