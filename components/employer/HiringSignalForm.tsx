"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { FitSignal, HiringIntent, HiringSignal, WorkMode } from "@/lib/employer/types";
import { HIRING_INTENT_LABELS, WORK_MODE_LABELS } from "@/lib/employer/types";
import { apiErrorMessage, readApiJson, withSupabaseAuthHeaders } from "@/lib/api-fetch";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

const DEFAULT_FIT: FitSignal[] = [
  { label: "", kind: "skill", weight: 2 },
  { label: "", kind: "trait", weight: 1 },
];

type Props = {
  initial?: HiringSignal;
};

export default function HiringSignalForm({ initial }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [workMode, setWorkMode] = useState<WorkMode>(initial?.work_mode ?? "flexible");
  const [hiringIntent, setHiringIntent] = useState<HiringIntent>(
    initial?.hiring_intent ?? "actively_hiring",
  );
  const [whyNow, setWhyNow] = useState(initial?.why_now ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [compHint, setCompHint] = useState(initial?.comp_hint ?? "");
  const [fitSignals, setFitSignals] = useState<FitSignal[]>(
    initial?.fit_signals?.length ? initial.fit_signals : DEFAULT_FIT,
  );
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function updateFit(index: number, patch: Partial<FitSignal>) {
    setFitSignals((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function validate(): string | null {
    if (!title.trim()) return "Signal title is required.";
    if (!whyNow.trim()) return "Why now is required — explain what made this role real.";
    return null;
  }

  async function submit(status: "draft" | "live") {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSuccessMessage("");
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        location: location.trim(),
        work_mode: workMode,
        hiring_intent: hiringIntent,
        why_now: whyNow.trim(),
        description: description.trim(),
        comp_hint: compHint.trim(),
        fit_signals: fitSignals.filter((f) => f.label.trim()),
        status,
      };
      const url = initial ? `/api/employer/signals/${initial.id}` : "/api/employer/signals";
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: await withSupabaseAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = (await readApiJson(res)) as {
        ok?: boolean;
        error?: string;
        signal?: { id: string };
      };
      if (!res.ok || !data.ok) {
        setError(apiErrorMessage(data) ?? data.error ?? "Could not save signal");
        return;
      }
      const signalId = data.signal?.id ?? initial?.id;
      if (!signalId) {
        setError("Signal saved but no id was returned — refresh and try again.");
        return;
      }

      const roleTitle = title.trim();
      if (status === "live") {
        const message = `"${roleTitle}" is live on WorkGraph Direct and the jobseeker Jobs tab.`;
        setSuccessMessage(message);
        toast({
          title: "Signal published",
          description: message,
          variant: "success",
        });
      } else {
        const message = `"${roleTitle}" was saved as a draft. Publish when you're ready to go live.`;
        setSuccessMessage(message);
        toast({
          title: "Draft saved",
          description: message,
          variant: "success",
        });
      }

      const query = status === "live" ? "published=1" : "saved=draft";
      router.push(`/employer/signals/${signalId}?${query}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error — try again");
    } finally {
      setSaving(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void submit("live");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {initial ? "Edit hiring signal" : "Post a hiring signal"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Share why the role exists and what actually fits — seekers connect with their WorkGraph profile,
          not a cover letter factory.
        </p>
      </div>

      {successMessage ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <section className="space-y-4 rounded-xl border p-5">
        <h2 className="text-sm font-semibold">Role</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Founding product engineer"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City or region"
            />
          </div>
          <div className="space-y-2">
            <Label>Work mode</Label>
            <Select value={workMode} onValueChange={(v) => setWorkMode(v as WorkMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(WORK_MODE_LABELS) as WorkMode[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {WORK_MODE_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Hiring intent</Label>
            <Select value={hiringIntent} onValueChange={(v) => setHiringIntent(v as HiringIntent)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(HIRING_INTENT_LABELS) as HiringIntent[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {HIRING_INTENT_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="comp">Comp hint (optional)</Label>
            <Input
              id="comp"
              value={compHint}
              onChange={(e) => setCompHint(e.target.value)}
              placeholder="e.g. $140–170k + equity"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-[var(--wg-red)]/20 bg-[var(--wg-red)]/[0.03] p-5">
        <h2 className="text-sm font-semibold">Why now?</h2>
        <p className="text-xs text-muted-foreground">
          What changed that made this role real? This replaces generic &quot;About the role&quot; boilerplate.
        </p>
        <Textarea
          id="why-now"
          value={whyNow}
          onChange={(e) => setWhyNow(e.target.value)}
          rows={3}
          placeholder="We just closed Series A and need someone to own the data pipeline before Q3 launches…"
          required
        />
      </section>

      <section className="space-y-4 rounded-xl border p-5">
        <h2 className="text-sm font-semibold">Context</h2>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="Team shape, what success looks like in 90 days, what you are not looking for…"
        />
      </section>

      <section className="space-y-4 rounded-xl border p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Fit signals</h2>
            <p className="text-xs text-muted-foreground">
              Weighted criteria we score against a seeker&apos;s profile — not keyword stuffing.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setFitSignals((p) => [...p, { label: "", kind: "skill", weight: 1 }])}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
        <ul className="space-y-3">
          {fitSignals.map((f, i) => (
            <li key={i} className="flex flex-wrap items-end gap-2">
              <div className="min-w-[140px] flex-1 space-y-1">
                <Label className="text-xs">Label</Label>
                <Input
                  value={f.label}
                  onChange={(e) => updateFit(i, { label: e.target.value })}
                  placeholder="e.g. TypeScript, ownership, early-stage"
                />
              </div>
              <div className="w-28 space-y-1">
                <Label className="text-xs">Kind</Label>
                <Select
                  value={f.kind}
                  onValueChange={(v) => updateFit(i, { kind: v as FitSignal["kind"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skill">Skill</SelectItem>
                    <SelectItem value="trait">Trait</SelectItem>
                    <SelectItem value="context">Context</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-20 space-y-1">
                <Label className="text-xs">Weight</Label>
                <Select
                  value={String(f.weight)}
                  onValueChange={(v) => updateFit(i, { weight: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => setFitSignals((p) => p.filter((_, j) => j !== i))}
                aria-label="Remove fit signal"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Publish signal
        </Button>
        <Button type="button" variant="outline" disabled={saving} onClick={() => void submit("draft")}>
          Save draft
        </Button>
      </div>
    </form>
  );
}
