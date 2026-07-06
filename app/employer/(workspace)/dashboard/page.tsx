"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Radio } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { EmployerProfile, HiringSignal } from "@/lib/employer/types";
import { HIRING_INTENT_LABELS } from "@/lib/employer/types";
import PulseInbox from "@/components/employer/PulseInbox";
import VerificationBanner from "@/components/employer/VerificationBanner";
import { AppShell } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EmployerDashboardPage() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const [signals, setSignals] = useState<HiringSignal[]>([]);
  const [employerProfile, setEmployerProfile] = useState<EmployerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sigRes, profRes] = await Promise.all([
        fetch("/api/employer/signals"),
        fetch("/api/employer/profile"),
      ]);
      const sigData = (await sigRes.json()) as { ok?: boolean; signals?: HiringSignal[] };
      const profData = (await profRes.json()) as { ok?: boolean; profile?: EmployerProfile | null };
      if (sigData.ok) setSignals(sigData.signals ?? []);
      if (profData.ok && profData.profile) setEmployerProfile(profData.profile);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (tab === "inbox") {
    return (
      <AppShell.Page>
        <AppShell.Content constrained={false}>
          <PulseInbox />
        </AppShell.Content>
      </AppShell.Page>
    );
  }

  return (
    <AppShell.Page>
      <AppShell.PageHeader padding={false}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-heading-l">
              <LayoutDashboard className="h-7 w-7 text-[var(--accent)]" />
              Hiring signals
            </h1>
            <p className="mt-1 text-body text-muted-foreground">
              Live signals appear in WorkGraph Direct for jobseekers.
            </p>
          </div>
          <Button asChild>
            <Link href="/employer/signals/new">
              <Radio className="mr-2 h-4 w-4" />
              New signal
            </Link>
          </Button>
        </div>
      </AppShell.PageHeader>

      <AppShell.Content constrained={false} className="space-y-6">
      {employerProfile ? (
        <VerificationBanner profile={employerProfile} onUpdated={setEmployerProfile} />
      ) : null}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-muted-foreground" />
        </div>
      ) : signals.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 py-10 text-center">
            <p className="text-body text-muted-foreground">No signals yet.</p>
            <Button asChild>
              <Link href="/employer/signals/new">Post your first hiring signal</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {signals.map((s) => (
            <li key={s.id}>
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                  <div>
                    <CardTitle className="text-body-lg">
                      <Link
                        href={`/employer/signals/${s.id}`}
                        className="hover:text-[var(--accent)]"
                      >
                        {s.title}
                      </Link>
                    </CardTitle>
                    <p className="text-caption text-muted-foreground mt-1">
                      {HIRING_INTENT_LABELS[s.hiring_intent]} · {s.applies_count} connection
                      {s.applies_count === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Badge variant={s.status === "live" ? "default" : "secondary"}>{s.status}</Badge>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      )}
      </AppShell.Content>
    </AppShell.Page>
  );
}
