"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  Building2,
  MapPin,
  Radio,
  Send,
  Sparkles,
} from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import type { HiringSignal, SignalConnection } from "@/lib/employer/types";
import { HIRING_INTENT_LABELS, WORK_MODE_LABELS } from "@/lib/employer/types";
import { scoreFitSignals } from "@/lib/employer/fit-signals";
import { apiErrorMessage, readApiJson, withSupabaseAuthHeaders } from "@/lib/api-fetch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EmptyState from "@/components/design-system/EmptyState";
import { ListSkeleton } from "@/components/ui/skeleton";
import ApplicationConnectDialog, {
  type ApplicationFormValues,
} from "./ApplicationConnectDialog";

type Props = {
  skills: string[];
  headline?: string | null;
  summary?: string | null;
  profileCompleteness: number;
  resumeUrl?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  websiteUrl?: string | null;
  stackoverflowUrl?: string | null;
};

export default function WorkgraphDirectSection({
  skills,
  headline,
  summary,
  profileCompleteness,
  resumeUrl,
  linkedinUrl,
  githubUrl,
  websiteUrl,
  stackoverflowUrl,
}: Props) {
  const searchParams = useSearchParams();
  const deepLinkSignalId = searchParams.get("signal");
  const [signals, setSignals] = useState<HiringSignal[]>([]);
  const [connections, setConnections] = useState<SignalConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectTarget, setConnectTarget] = useState<HiringSignal | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");

  const defaultFormValues = useMemo<ApplicationFormValues>(
    () => ({
      message: "",
      resumeUrl: resumeUrl ?? "",
      linkedinUrl: linkedinUrl ?? "",
      githubUrl: githubUrl ?? "",
      websiteUrl: websiteUrl ?? "",
      stackoverflowUrl: stackoverflowUrl ?? "",
    }),
    [resumeUrl, linkedinUrl, githubUrl, websiteUrl, stackoverflowUrl],
  );

  const profileInput = useMemo(
    () => ({ skills, headline, summary, profileCompleteness }),
    [skills, headline, summary, profileCompleteness],
  );

  const connectedIds = useMemo(
    () => new Set(connections.map((c) => c.signal_id)),
    [connections],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [sigRes, connRes] = await Promise.all([
        fetch("/api/hiring-signals", { credentials: "include" }),
        fetch("/api/hiring-signals/connect", {
          credentials: "include",
          headers: await withSupabaseAuthHeaders(),
        }),
      ]);
      const sigData = (await readApiJson(sigRes)) as { ok?: boolean; signals?: HiringSignal[] };
      const connData = (await readApiJson(connRes)) as { ok?: boolean; connections?: SignalConnection[] };
      if (sigData.ok) setSignals(sigData.signals ?? []);
      if (connData.ok) setConnections(connData.connections ?? []);
      if (!sigRes.ok) setError("Could not load hiring signals");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!deepLinkSignalId || loading || signals.length === 0) return;
    const target = signals.find((s) => s.id === deepLinkSignalId);
    if (target) setConnectTarget(target);
  }, [deepLinkSignalId, loading, signals]);

  async function submitApplication(values: ApplicationFormValues) {
    if (!connectTarget) return;
    setConnecting(true);
    setConnectError("");
    try {
      const res = await fetch("/api/hiring-signals/connect", {
        method: "POST",
        headers: await withSupabaseAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({
          signalId: connectTarget.id,
          connectionNote: values.message,
          message: values.message,
          resumeUrl: values.resumeUrl || null,
          linkedinUrl: values.linkedinUrl || null,
          githubUrl: values.githubUrl || null,
          websiteUrl: values.websiteUrl || null,
          stackoverflowUrl: values.stackoverflowUrl || null,
        }),
      });
      const data = (await readApiJson(res)) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setConnectError(apiErrorMessage(data) ?? data.error ?? "Could not submit application");
        return;
      }
      setConnectTarget(null);
      void load();
    } catch {
      setConnectError("Network error");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="flex flex-col gap-[var(--layout-section-gap)]">
      <header>
        <div className="flex items-center gap-[var(--space-2)]">
          <Radio className={iconClass("standalone", "text-[var(--wg-red)]")} aria-hidden />
          <h1 className="text-role-title">WorkGraph Direct</h1>
        </div>
        <p className="mt-1 text-role-body text-muted-foreground">
          Apply to employer hiring signals with your resume, profile links, and a tailored message —
          employers review your full application in their Pulse inbox.
        </p>
      </header>

      {connections.length > 0 ? (
        <section className="rounded-[var(--radius-card)] border border-hairline bg-muted/30 p-[var(--layout-card-pad-mobile)] md:p-[var(--layout-card-pad)]">
          <h2 className="text-role-card-title">Your applications</h2>
          <ul className="mt-[var(--space-2)] flex flex-col gap-[var(--space-2)]">
            {connections.slice(0, 5).map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-[var(--space-2)] text-role-body">
                <span>{c.signal?.title ?? "Signal"}</span>
                <Badge variant="outline">{c.stage}</Badge>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {loading ? (
        <ListSkeleton rows={4} className="py-4" />
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : signals.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="No live hiring signals yet"
          description="Employers on WorkGraph publish intent posts here. Check back soon, or post as an employer."
          action={
            <Button asChild variant="outline" size="sm">
              <a href="/employer/signup">Post as an employer</a>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-[var(--layout-card-gap)] sm:grid-cols-2">
          {signals.map((signal) => {
            const preview = scoreFitSignals(signal.fit_signals, profileInput);
            const already = connectedIds.has(signal.id);
            return (
              <li key={signal.id}>
                <Card className="h-full border-[var(--wg-red)]/10">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-[var(--space-2)]">
                      <div>
                        <p className="flex flex-wrap items-center gap-[var(--space-2)] text-role-caption font-medium text-muted-foreground">
                          <Building2 className={iconClass("inline", "shrink-0")} />
                          {signal.employer?.verification_status === "verified" &&
                          signal.employer.company_slug ? (
                            <Link
                              href={`/company/${signal.employer.company_slug}`}
                              className="hover:text-[var(--wg-red)] hover:underline"
                            >
                              {signal.employer.company_name}
                            </Link>
                          ) : (
                            <span>{signal.employer?.company_name}</span>
                          )}
                          {signal.employer?.verification_status === "verified" ? (
                            <Badge
                              variant="outline"
                              className="h-5 gap-0.5 border-positive/40 px-1.5 text-role-caption text-positive"
                            >
                              <BadgeCheck className={iconClass()} />
                              Verified
                            </Badge>
                          ) : null}
                        </p>
                        <CardTitle className="mt-1">{signal.title}</CardTitle>
                      </div>
                      <Badge className="shrink-0 bg-[var(--wg-red)]/10 text-[var(--wg-red)] hover:bg-[var(--wg-red)]/15">
                        <Sparkles className={iconClass("inline", "mr-1")} />
                        {preview.matchPercent}% fit
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-[var(--space-3)] text-role-body">
                    <div className="flex flex-wrap gap-[var(--space-2)] text-role-caption text-muted-foreground">
                      {signal.location ? (
                        <span className="flex items-center gap-1">
                          <MapPin className={iconClass()} />
                          {signal.location}
                        </span>
                      ) : null}
                      <span>{WORK_MODE_LABELS[signal.work_mode]}</span>
                      <span>{HIRING_INTENT_LABELS[signal.hiring_intent]}</span>
                    </div>
                    {signal.why_now ? (
                      <p className="border-l-2 border-[var(--wg-red)] pl-[var(--space-2)] text-role-caption italic text-foreground/80">
                        {signal.why_now}
                      </p>
                    ) : null}
                    {preview.matchedSignals.length > 0 ? (
                      <div className="flex flex-wrap gap-[var(--space-1)]">
                        {preview.matchedSignals.map((s) => (
                          <Badge key={s} variant="secondary" className="text-role-caption">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                    <Button
                      className="w-full"
                      disabled={already}
                      onClick={() => setConnectTarget(signal)}
                    >
                      {already ? "Applied" : "Apply"}
                      {!already ? <Send className={iconClass("inline", "ml-2")} /> : null}
                    </Button>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <ApplicationConnectDialog
        signal={connectTarget}
        open={!!connectTarget}
        onOpenChange={(open) => !open && setConnectTarget(null)}
        initialValues={defaultFormValues}
        onSubmit={submitApplication}
        submitting={connecting}
        error={connectError}
      />
    </div>
  );
}
