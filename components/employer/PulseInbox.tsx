"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, FileText, Sparkles } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { ConnectionStage, SignalConnection } from "@/lib/employer/types";
import {
  CONNECTION_STAGE_LABELS,
  CONNECTION_STAGE_ORDER,
} from "@/lib/employer/types";
import ApplicantApplicationPanel from "@/components/employer/ApplicantApplicationPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  signalId?: string;
};

export default function PulseInbox({ signalId }: Props) {
  const [connections, setConnections] = useState<SignalConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailConnection, setDetailConnection] = useState<SignalConnection | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const q = signalId ? `?signalId=${encodeURIComponent(signalId)}` : "";
      const res = await fetch(`/api/employer/inbox${q}`);
      const data = (await res.json()) as { ok?: boolean; connections?: SignalConnection[]; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Failed to load");
        return;
      }
      setConnections(data.connections ?? []);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [signalId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function moveStage(connectionId: string, stage: ConnectionStage) {
    const res = await fetch("/api/employer/inbox", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connectionId, stage }),
    });
    if (res.ok) void load();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" className="text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <p className="text-body text-destructive">{error}</p>;
  }

  const byStage = Object.fromEntries(
    CONNECTION_STAGE_ORDER.map((s) => [s, connections.filter((c) => c.stage === s)]),
  ) as Record<ConnectionStage, SignalConnection[]>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-heading-s">Pulse inbox</h2>
        <p className="text-body text-muted-foreground">
          Review applicant resumes, links, and profile details — click a card for the full application.
        </p>
      </div>

      {connections.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-body text-muted-foreground">
            No applications yet. When seekers apply to your live signals, their resume and profile
            package appears here.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          {CONNECTION_STAGE_ORDER.map((stage) => (
            <div key={stage} className="min-w-0 space-y-2">
              <h3 className="text-caption font-semibold uppercase tracking-wide text-muted-foreground">
                {CONNECTION_STAGE_LABELS[stage]} ({byStage[stage].length})
              </h3>
              <ul className="space-y-2">
                {byStage[stage].map((c) => {
                  const app = c.application_snapshot;
                  const resumeUrl = app?.resume_url;
                  return (
                    <Card
                      key={c.id}
                      className="cursor-pointer overflow-hidden transition hover:border-[var(--accent)]/30"
                      onClick={() => setDetailConnection(c)}
                    >
                      <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-body font-medium leading-snug">
                          {app?.full_name ?? c.seeker?.full_name ?? "Applicant"}
                        </CardTitle>
                        <p className="text-caption text-muted-foreground line-clamp-1">
                          {app?.headline ?? c.seeker?.headline ?? c.signal?.title}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-2 p-3 pt-0">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden />
                          <span className="text-body font-semibold tabular-nums">
                            {c.fit_snapshot?.matchPercent ?? "—"}% fit
                          </span>
                        </div>
                        {c.fit_snapshot?.matchedSignals?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {c.fit_snapshot.matchedSignals.slice(0, 4).map((s) => (
                              <Badge key={s} variant="secondary" className="text-caption">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                        {app?.message || c.connection_note ? (
                          <p className="text-caption text-muted-foreground line-clamp-2">
                            {app?.message || c.connection_note}
                          </p>
                        ) : null}
                        {resumeUrl ? (
                          <a
                            href={resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-caption font-medium text-[var(--accent)] hover:underline"
                          >
                            <FileText className="h-3 w-3" />
                            Resume
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null}
                        <div className="flex flex-wrap gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
                          {CONNECTION_STAGE_ORDER.filter((s) => s !== stage).map((s) => (
                            <Button
                              key={s}
                              type="button"
                              variant="ghost"
                              size="sm"
                              className={cn("h-7 px-2 text-caption")}
                              onClick={() => void moveStage(c.id, s)}
                            >
                              → {CONNECTION_STAGE_LABELS[s]}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      <ApplicantApplicationPanel
        connection={detailConnection}
        open={!!detailConnection}
        onOpenChange={(open) => !open && setDetailConnection(null)}
      />
    </div>
  );
}
