"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { HiringSignal } from "@/lib/employer/types";
import { readApiJson, withSupabaseAuthHeaders } from "@/lib/api-fetch";
import HiringSignalForm from "@/components/employer/HiringSignalForm";
import PulseInbox from "@/components/employer/PulseInbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EditHiringSignalPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = String(params.id ?? "");
  const [signal, setSignal] = useState<HiringSignal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/employer/signals/${id}`, {
        credentials: "include",
        headers: await withSupabaseAuthHeaders(),
      });
      const data = (await readApiJson(res)) as { ok?: boolean; signal?: HiringSignal };
      if (data.ok && data.signal) setSignal(data.signal);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get("published") === "1") {
      setSaveNotice("This hiring signal is published and visible to jobseekers on WorkGraph Direct and the Jobs tab.");
      window.history.replaceState(null, "", `/employer/signals/${id}`);
      return;
    }
    if (searchParams.get("saved") === "draft") {
      setSaveNotice("Draft saved. Publish when you're ready to go live.");
      window.history.replaceState(null, "", `/employer/signals/${id}`);
    }
  }, [searchParams, id]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!signal) {
    return <p className="text-body text-muted-foreground">Signal not found.</p>;
  }

  return (
    <div className="space-y-10">
      {saveNotice ? (
        <Alert className="border-success/20 bg-success-subtle text-success-foreground dark:border-success/20 dark:bg-success-subtle/40 dark:text-success-foreground">
          <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
          <AlertDescription>{saveNotice}</AlertDescription>
        </Alert>
      ) : null}
      <HiringSignalForm initial={signal} />
      <PulseInbox signalId={id} />
    </div>
  );
}
