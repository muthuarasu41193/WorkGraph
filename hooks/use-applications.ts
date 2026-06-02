"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { supabaseConfigured } from "@/lib/supabase-enabled";
import {
  mapApplicationRow,
  type Application,
  type ApplicationInsert,
  type ApplicationStatus,
  type ApplicationUpdate,
} from "@/lib/applications";

type ApplicationsResponse = { ok: boolean; applications?: Application[]; error?: string };
type ApplicationResponse = { ok: boolean; application?: Application; error?: string };

async function fetchApplications(): Promise<Application[]> {
  const res = await fetch("/api/applications", { credentials: "include" });
  const data = (await res.json()) as ApplicationsResponse;
  if (!res.ok || !data.ok) {
    throw new Error(data.error ?? "Failed to load applications");
  }
  return data.applications ?? [];
}

export function useApplications(userId: string) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const list = await fetchApplications();
      setApplications(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!supabaseConfigured() || !userId) return;

    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`applications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "applications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE" && payload.old) {
            const oldId = String((payload.old as { id?: string }).id ?? "");
            setApplications((prev) => prev.filter((a) => a.id !== oldId));
            return;
          }

          if (payload.new) {
            const row = mapApplicationRow(payload.new as Record<string, unknown>);
            setApplications((prev) => {
              const idx = prev.findIndex((a) => a.id === row.id);
              if (idx === -1) return [row, ...prev];
              const next = [...prev];
              next[idx] = row;
              return next;
            });
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const createApplication = useCallback(async (input: ApplicationInsert) => {
    const res = await fetch("/api/applications", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await res.json()) as ApplicationResponse;
    if (!res.ok || !data.ok || !data.application) {
      throw new Error(data.error ?? "Failed to create application");
    }
    setApplications((prev) => [data.application!, ...prev.filter((a) => a.id !== data.application!.id)]);
    return data.application;
  }, []);

  const updateApplication = useCallback(async (id: string, patch: ApplicationUpdate) => {
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = (await res.json()) as ApplicationResponse;
    if (!res.ok || !data.ok || !data.application) {
      throw new Error(data.error ?? "Failed to update application");
    }
    setApplications((prev) => prev.map((a) => (a.id === id ? data.application! : a)));
    return data.application;
  }, []);

  const moveApplication = useCallback(
    async (id: string, status: ApplicationStatus) => {
      return updateApplication(id, { status });
    },
    [updateApplication],
  );

  const deleteApplication = useCallback(async (id: string) => {
    const res = await fetch(`/api/applications/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    if (!res.ok || !data.ok) {
      throw new Error(data.error ?? "Failed to delete application");
    }
    setApplications((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return {
    applications,
    loading,
    error,
    refresh,
    createApplication,
    updateApplication,
    moveApplication,
    deleteApplication,
  };
}
