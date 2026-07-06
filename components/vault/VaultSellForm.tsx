"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Loader2, Save } from "lucide-react";
import VaultRichEditor from "@/components/vault/VaultRichEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  VAULT_DIFFICULTIES,
  VAULT_DIFFICULTY_LABELS,
  VAULT_RESULTS,
  VAULT_RESULT_LABELS,
  VAULT_SELL_STEPS,
  type VaultExperience,
  type VaultRound,
} from "@/lib/vault";
import { cn } from "@/lib/utils";

type Props = {
  initialDraft: VaultExperience | null;
};

const AUTOSAVE_MS = 2000;

export default function VaultSellForm({ initialDraft }: Props) {
  const router = useRouter();
  const [draftId, setDraftId] = useState<string | null>(initialDraft?.id ?? null);
  const [step, setStep] = useState(initialDraft?.draft_step ?? 0);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [company, setCompany] = useState(initialDraft?.company ?? "");
  const [role, setRole] = useState(initialDraft?.role ?? "");
  const [level, setLevel] = useState(initialDraft?.level ?? "");
  const [difficulty, setDifficulty] = useState(initialDraft?.difficulty ?? "");
  const [rounds, setRounds] = useState(String(initialDraft?.rounds ?? ""));
  const [result, setResult] = useState(initialDraft?.result ?? "");
  const [interviewDate, setInterviewDate] = useState(initialDraft?.interview_date ?? "");
  const [roundsData, setRoundsData] = useState<VaultRound[]>(
    initialDraft?.rounds_data?.length
      ? initialDraft.rounds_data
      : [{ name: "Round 1", description: "", duration: "" }],
  );
  const [questionsHtml, setQuestionsHtml] = useState(initialDraft?.questions_html ?? "");
  const [tipsHtml, setTipsHtml] = useState(initialDraft?.tips_html ?? "");
  const [priceInr, setPriceInr] = useState(String(initialDraft?.price_inr ?? 499));

  const ensureDraft = useCallback(async (): Promise<string> => {
    if (draftId) return draftId;
    const res = await fetch("/api/vault/experiences", { method: "POST" });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error ?? "Failed to create draft");
    setDraftId(data.experience.id);
    return data.experience.id as string;
  }, [draftId]);

  const saveDraft = useCallback(async () => {
    setSaving(true);
    try {
      const id = await ensureDraft();
      const res = await fetch(`/api/vault/experiences/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          role,
          level: level || null,
          difficulty: difficulty || null,
          rounds: rounds ? Number(rounds) : null,
          result: result || null,
          interview_date: interviewDate || null,
          rounds_data: roundsData,
          questions_html: questionsHtml,
          tips_html: tipsHtml,
          price_inr: Number(priceInr) || 499,
          draft_step: step,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Save failed");
      setLastSaved(new Date());
    } catch (err) {
      toast({
        title: "Auto-save failed",
        description: err instanceof Error ? err.message : "Could not save draft",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }, [
    ensureDraft,
    company,
    role,
    level,
    difficulty,
    rounds,
    result,
    interviewDate,
    roundsData,
    questionsHtml,
    tipsHtml,
    priceInr,
    step,
  ]);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveDraft();
    }, AUTOSAVE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [saveDraft]);

  async function publish() {
    if (!company.trim() || !role.trim()) {
      toast({ title: "Missing fields", description: "Company and role are required.", variant: "error" });
      return;
    }
    setSaving(true);
    try {
      const id = await ensureDraft();
      await saveDraft();
      const res = await fetch(`/api/vault/experiences/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Publish failed");
      toast({ title: "Published!", description: "Your experience is live on the marketplace.", variant: "success" });
      router.push(`/interview-vault/${id}`);
    } catch (err) {
      toast({
        title: "Publish failed",
        description: err instanceof Error ? err.message : "Could not publish",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  function updateRound(index: number, patch: Partial<VaultRound>) {
    setRoundsData((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRound() {
    setRoundsData((prev) => [...prev, { name: `Round ${prev.length + 1}`, description: "", duration: "" }]);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-heading-l">Sell Your Experience</h1>
        <p className="mt-1 text-body text-muted-foreground">
          Share your interview playbook and earn when others unlock it. Drafts auto-save every few seconds.
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-caption text-muted-foreground">
          {saving ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" /> Saving…
            </>
          ) : lastSaved ? (
            <>
              <Save className="h-3 w-3" /> Saved {lastSaved.toLocaleTimeString()}
            </>
          ) : (
            "Draft will auto-save as you type"
          )}
        </p>
      </header>

      <ol className="flex flex-wrap gap-2" aria-label="Form steps">
        {VAULT_SELL_STEPS.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => setStep(s.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-caption font-medium transition-colors",
                step === s.id ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted",
                step > s.id && "border-green-500/50 text-green-700 dark:text-green-400",
              )}
            >
              {step > s.id ? <Check className="h-3 w-3" /> : null}
              {s.label}
            </button>
          </li>
        ))}
      </ol>

      <Card>
        <CardHeader>
          <CardTitle>{VAULT_SELL_STEPS[step]?.label}</CardTitle>
          <CardDescription>
            {step === 0 && "Which company did you interview with?"}
            {step === 1 && "What role and level was the interview for?"}
            {step === 2 && "Describe each round of the process."}
            {step === 3 && "List the questions you were asked."}
            {step === 4 && "Share preparation tips and advice."}
            {step === 5 && "Set your price in INR."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="company">Company</Label>
                <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Google" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger id="difficulty">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {VAULT_DIFFICULTIES.map((d) => (
                        <SelectItem key={d} value={d}>
                          {VAULT_DIFFICULTY_LABELS[d]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="interview-date">Interview date</Label>
                  <Input id="interview-date" type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
                </div>
              </div>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="role">Role</Label>
                <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Software Engineer" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="level">Level</Label>
                  <Input id="level" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="e.g. L4, SDE-2" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="result">Outcome</Label>
                  <Select value={result} onValueChange={setResult}>
                    <SelectTrigger id="result">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {VAULT_RESULTS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {VAULT_RESULT_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="round-count">Total rounds</Label>
                <Input id="round-count" type="number" min={1} max={20} value={rounds} onChange={(e) => setRounds(e.target.value)} />
              </div>
              {roundsData.map((round, i) => (
                <div key={i} className="space-y-2 rounded-lg border p-3">
                  <Input
                    value={round.name}
                    onChange={(e) => updateRound(i, { name: e.target.value })}
                    placeholder="Round name"
                  />
                  <Input
                    value={round.duration ?? ""}
                    onChange={(e) => updateRound(i, { duration: e.target.value })}
                    placeholder="Duration (e.g. 45 min)"
                  />
                  <VaultRichEditor
                    value={round.description}
                    onChange={(html) => updateRound(i, { description: html })}
                    placeholder="What happened in this round?"
                    minHeight="100px"
                  />
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addRound}>
                Add round
              </Button>
            </>
          ) : null}

          {step === 3 ? (
            <VaultRichEditor
              value={questionsHtml}
              onChange={setQuestionsHtml}
              placeholder="List coding questions, system design prompts, behavioral questions…"
              minHeight="240px"
            />
          ) : null}

          {step === 4 ? (
            <VaultRichEditor
              value={tipsHtml}
              onChange={setTipsHtml}
              placeholder="What would you do differently? Resources that helped? Insider tips?"
              minHeight="240px"
            />
          ) : null}

          {step === 5 ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="price">Price (INR)</Label>
                <Input
                  id="price"
                  type="number"
                  min={99}
                  max={9999}
                  value={priceInr}
                  onChange={(e) => setPriceInr(e.target.value)}
                />
                <p className="text-caption text-muted-foreground">You keep 70% of each sale. Recommended: ₹299–₹999.</p>
              </div>
              <Button type="button" onClick={() => void publish()} disabled={saving}>
                Publish to marketplace
              </Button>
            </>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        {step < VAULT_SELL_STEPS.length - 1 ? (
          <Button type="button" onClick={() => setStep((s) => s + 1)}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
