"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import type { ConnectionStage, SignalConnection } from "@/lib/employer/types";
import {
  CONNECTION_STAGE_LABELS,
  CONNECTION_STAGE_ORDER,
} from "@/lib/employer/types";
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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  const byStage = Object.fromEntries(
    CONNECTION_STAGE_ORDER.map((s) => [s, connections.filter((c) => c.stage === s)]),
  ) as Record<ConnectionStage, SignalConnection[]>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Pulse inbox</h2>
        <p className="text-sm text-muted-foreground">
          Connections ranked by fit snapshot — stages are dialogue, not ATS funnel copy.
        </p>
      </div>

      {connections.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No connections yet. When seekers connect to your live signals, they appear here with fit
            scores from their WorkGraph profile.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          {CONNECTION_STAGE_ORDER.map((stage) => (
            <div key={stage} className="min-w-0 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {CONNECTION_STAGE_LABELS[stage]} ({byStage[stage].length})
              </h3>
              <ul className="space-y-2">
                {byStage[stage].map((c) => (
                  <Card key={c.id} className="overflow-hidden">
                    <CardHeader className="p-3 pb-1">
                      <CardTitle className="text-sm font-medium leading-snug">
                        {c.seeker?.full_name ?? "Seeker"}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {c.seeker?.headline ?? c.signal?.title}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-2 p-3 pt-0">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-[var(--wg-red)]" aria-hidden />
                        <span className="text-sm font-semibold tabular-nums">
                          {c.fit_snapshot?.matchPercent ?? "—"}% fit
                        </span>
                      </div>
                      {c.fit_snapshot?.matchedSignals?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {c.fit_snapshot.matchedSignals.slice(0, 4).map((s) => (
                            <Badge key={s} variant="secondary" className="text-[10px]">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                      {c.connection_note ? (
                        <p className="text-xs text-muted-foreground line-clamp-3">{c.connection_note}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {CONNECTION_STAGE_ORDER.filter((s) => s !== stage).map((s) => (
                          <Button
                            key={s}
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn("h-7 px-2 text-[10px]")}
                            onClick={() => void moveStage(c.id, s)}
                          >
                            → {CONNECTION_STAGE_LABELS[s]}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
