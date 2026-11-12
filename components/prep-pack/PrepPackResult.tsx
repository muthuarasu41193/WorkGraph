"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckSquare, Copy, ExternalLink, Lock } from "lucide-react";
import { SourceLabel } from "@/components/prep-pack/SourceLabel";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { toast } from "@/hooks/use-toast";
import { iconClass } from "@/lib/icon-styles";
import type { PrepPackResult } from "@/lib/prep-pack";
import { trackEvent } from "@/lib/analytics";

type ShareInput = {
  jobDescription?: string;
  roleTemplateId?: string;
  companyHint?: string;
  titleHint?: string;
};

type Props = {
  pack: PrepPackResult;
  isLoggedIn: boolean;
  shareInput?: ShareInput;
  sharedView?: boolean;
};

export function PrepPackResultView({ pack, isLoggedIn, shareInput, sharedView }: Props) {
  const [sharing, setSharing] = useState(false);
  const [sharePath, setSharePath] = useState<string | null>(
    pack.share_id ? `/prepare/${pack.share_id}` : null,
  );

  async function handleShare() {
    if (!shareInput) return;
    setSharing(true);
    try {
      const res = await fetch("/api/prep-pack/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shareInput),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        path?: string;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.path) {
        throw new Error(data.error ?? "Could not create a share link.");
      }
      setSharePath(data.path);
      const url = `${window.location.origin}${data.path}`;
      await navigator.clipboard.writeText(url);
      trackEvent("prep_pack_share_copied", { mode: pack.input_mode });
      toast({
        title: "Share link copied",
        description: "The link includes requirements and guides only — not your pasted job description.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Share unavailable",
        description: err instanceof Error ? err.message : "Could not create a share link.",
        variant: "error",
      });
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="space-y-8" aria-live="polite">
      <header className="space-y-3">
        <Text as="h2" role="heading">
          {pack.title ?? "Interview prep pack"}
          {pack.company ? ` · ${pack.company}` : ""}
        </Text>
        {pack.seniority ? (
          <Text role="body-small" className="text-ink-muted">
            Seniority signal: {pack.seniority}
          </Text>
        ) : null}
        <Text role="body-small" className="text-ink-muted">
          {sharedView
            ? "Shared pack — pasted job descriptions and private profile data are not included."
            : "Built without sending your job description to an external AI provider."}
        </Text>
      </header>

      <section aria-labelledby="prep-requirements" className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Text as="h3" id="prep-requirements" role="heading">
            Role requirements and skills
          </Text>
          <SourceLabel
            source={pack.input_mode === "job_description" ? "job_description" : "role_template"}
          />
        </div>
        {pack.requirements.length === 0 ? (
          <Text role="body-small" className="text-ink-muted">
            No clear skill list was extracted. Try pasting a fuller job description or pick another role.
          </Text>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {pack.requirements.map((skill) => (
              <li
                key={`${skill.kind}-${skill.name}`}
                className="rounded-[var(--radius-tag)] border border-hairline bg-surface px-3 py-1.5 text-role-caption"
              >
                <span className="text-ink">{skill.name}</span>
                <span className="ml-2 text-ink-subtle">{skill.kind}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="prep-guides" className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Text as="h3" id="prep-guides" role="heading">
            Relevant Interview Vault guides
          </Text>
          <SourceLabel source="firsthand_guide" />
        </div>
        {pack.guides.length === 0 ? (
          <div className="rounded-card border border-hairline bg-surface-raised p-4">
            <Text role="body-small" className="text-ink-muted">
              No close published guides matched yet. Browse the marketplace by company or role.
            </Text>
            <Button asChild variant="secondary" className="mt-3">
              <Link href="/interview-vault">Open Interview Vault</Link>
            </Button>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {pack.guides.map((guide) => (
              <li key={guide.id}>
                <Link
                  href={`/interview-vault/${guide.id}`}
                  className="block h-full rounded-card border border-hairline bg-surface p-4 transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  onClick={() => trackEvent("prep_pack_guide_click", { free: guide.price_inr === 0 })}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{guide.company}</p>
                      <p className="truncate text-role-body-small text-ink-muted">{guide.role}</p>
                    </div>
                    <span className="shrink-0 text-role-caption text-ink-muted">
                      {guide.price_inr === 0 ? "Free" : `₹${guide.price_inr.toLocaleString("en-IN")}`}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-role-body-small text-ink-muted">{guide.preview}</p>
                  <p className="mt-2 text-role-caption text-ink-subtle">{guide.freshness_label}</p>
                  <p className="mt-1 text-role-caption text-ink-subtle">{guide.match_reason}</p>
                  {guide.price_inr > 0 ? (
                    <p className="mt-2 inline-flex items-center gap-1 text-role-caption text-ink-muted">
                      <Lock className={iconClass("inline")} aria-hidden />
                      Preview only until unlocked
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="prep-checklist" className="space-y-3">
        <Text as="h3" id="prep-checklist" role="heading">
          Preparation checklist
        </Text>
        <ul className="space-y-2">
          {pack.checklist.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-2 rounded-card border border-hairline bg-surface p-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <span className="inline-flex items-start gap-2 text-role-body-small text-ink">
                <CheckSquare className={iconClass("inline", "mt-0.5 text-brand")} aria-hidden />
                {item.label}
              </span>
              <SourceLabel source={item.source} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="prep-practice" className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Text as="h3" id="prep-practice" role="heading">
            Suggested practice topics
          </Text>
          <SourceLabel source="estimate" />
        </div>
        <ul className="list-disc space-y-1 pl-5 text-role-body-small text-ink-muted">
          {pack.practice_topics.map((topic) => (
            <li key={topic.name}>{topic.name}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="prep-disclaimers" className="space-y-2 rounded-card border border-hairline bg-surface-raised p-4">
        <Text as="h3" id="prep-disclaimers" role="heading">
          Important
        </Text>
        <ul className="list-disc space-y-1 pl-5 text-role-body-small text-ink-muted">
          {pack.disclaimers.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {!sharedView && shareInput ? (
          <Button type="button" onClick={() => void handleShare()} disabled={sharing}>
            {sharing ? "Creating link…" : sharePath ? "Copy share link again" : "Share pack"}
            <Copy className={iconClass("inline")} aria-hidden />
          </Button>
        ) : null}
        {sharePath ? (
          <Button asChild variant="secondary">
            <Link href={sharePath}>
              Open share page
              <ExternalLink className={iconClass("inline")} aria-hidden />
            </Link>
          </Button>
        ) : null}
        {isLoggedIn ? (
          <Button asChild variant="secondary">
            <Link href="/profile?view=vault">Save notes in Prep Materials</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href={`/login?next=${encodeURIComponent("/prepare")}`}>
              Sign in to save or personalize
            </Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href="/interview-vault">Browse Interview Vault</Link>
        </Button>
      </div>
    </div>
  );
}
