"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { HiringSignal } from "@/lib/employer/types";
import HiringSignalForm from "@/components/employer/HiringSignalForm";
import PulseInbox from "@/components/employer/PulseInbox";

export default function EditHiringSignalPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [signal, setSignal] = useState<HiringSignal | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/employer/signals/${id}`);
      const data = (await res.json()) as { ok?: boolean; signal?: HiringSignal };
      if (data.ok && data.signal) setSignal(data.signal);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!signal) {
    return <p className="text-sm text-muted-foreground">Signal not found.</p>;
  }

  return (
    <div className="space-y-10">
      <HiringSignalForm initial={signal} />
      <PulseInbox signalId={id} />
    </div>
  );
}
