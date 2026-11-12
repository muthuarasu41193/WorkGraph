"use client";

import { useEffect, useState } from "react";
import { PrepPackResultView } from "@/components/prep-pack/PrepPackResult";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Text } from "@/components/ui/text";
import { trackEvent } from "@/lib/analytics";
import type { PrepPackResult } from "@/lib/prep-pack";

type RoleOption = {
  id: string;
  title: string;
  seniority: string;
  summary: string;
};

type Props = {
  isLoggedIn: boolean;
  initialRoles?: RoleOption[];
};

export function PrepPackForm({ isLoggedIn, initialRoles = [] }: Props) {
  const [mode, setMode] = useState<"job_description" | "role_template">("job_description");
  const [jobDescription, setJobDescription] = useState("");
  const [roleTemplateId, setRoleTemplateId] = useState(initialRoles[0]?.id ?? "software-engineer");
  const [roles, setRoles] = useState<RoleOption[]>(initialRoles);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pack, setPack] = useState<PrepPackResult | null>(null);

  useEffect(() => {
    if (roles.length > 0) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/prep-pack");
        const data = (await res.json()) as { ok?: boolean; roles?: RoleOption[] };
        if (!cancelled && data.ok && data.roles?.length) {
          setRoles(data.roles);
          setRoleTemplateId(data.roles[0]!.id);
        }
      } catch {
        // Role picker stays empty; JD mode still works.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roles.length]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body =
        mode === "job_description"
          ? { jobDescription }
          : { roleTemplateId };

      const res = await fetch("/api/prep-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { ok?: boolean; pack?: PrepPackResult; error?: string };
      if (!res.ok || !data.ok || !data.pack) {
        throw new Error(data.error ?? "Could not build a prep pack.");
      }
      setPack(data.pack);
      trackEvent("prep_pack_completed", {
        mode,
        guides: data.pack.guides.length,
      });
    } catch (err) {
      setPack(null);
      setError(err instanceof Error ? err.message : "Could not build a prep pack.");
    } finally {
      setLoading(false);
    }
  }

  const shareInput =
    mode === "job_description"
      ? { jobDescription }
      : { roleTemplateId };

  return (
    <div className="space-y-8">
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 rounded-card border border-hairline bg-surface p-4 sm:p-6">
        <div className="flex flex-wrap gap-2" role="group" aria-label="How to start">
          <Button
            type="button"
            variant={mode === "job_description" ? "default" : "secondary"}
            onClick={() => setMode("job_description")}
          >
            Paste a job description
          </Button>
          <Button
            type="button"
            variant={mode === "role_template" ? "default" : "secondary"}
            onClick={() => setMode("role_template")}
          >
            Choose a role
          </Button>
        </div>

        {mode === "job_description" ? (
          <div className="space-y-2">
            <Label htmlFor="prep-jd">Job description</Label>
            <Textarea
              id="prep-jd"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={10}
              required
              minLength={40}
              maxLength={20_000}
              placeholder="Paste the role title, company, and requirements…"
              className="min-h-40"
            />
            <Text role="caption" className="text-ink-subtle">
              Used only to build this pack. Sharing stores requirements and guide links — not the pasted text. Not sent to an external AI provider.
            </Text>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="prep-role">Role template</Label>
            <select
              id="prep-role"
              value={roleTemplateId}
              onChange={(e) => setRoleTemplateId(e.target.value)}
              className="flex h-10 w-full rounded-[var(--radius-button)] border border-border-default bg-surface px-3 text-role-body text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              required
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.title} · {role.seniority}
                </option>
              ))}
            </select>
            {roles.find((r) => r.id === roleTemplateId)?.summary ? (
              <Text role="body-small" className="text-ink-muted">
                {roles.find((r) => r.id === roleTemplateId)?.summary}
              </Text>
            ) : null}
            <Text role="caption" className="text-ink-subtle">
              Template skills are estimates for practice, not requirements from a specific posting.
            </Text>
          </div>
        )}

        {error ? (
          <p role="alert" className="text-role-body-small text-destructive">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={loading}>
          {loading ? "Building pack…" : "Get free prep pack"}
        </Button>
      </form>

      {pack ? (
        <PrepPackResultView
          pack={pack}
          isLoggedIn={isLoggedIn}
          shareInput={shareInput}
        />
      ) : null}
    </div>
  );
}
