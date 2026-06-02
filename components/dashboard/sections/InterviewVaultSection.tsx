"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useDashboardContext } from "@/components/dashboard/DashboardProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

type VaultNote = {
  id: string;
  company: string;
  role: string;
  questions: string;
  notes: string;
  updatedAt: string;
};

const STORAGE_KEY = "wg-interview-vault";

function loadNotes(userId: string): VaultNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${userId}`);
    return raw ? (JSON.parse(raw) as VaultNote[]) : [];
  } catch {
    return [];
  }
}

function saveNotes(userId: string, notes: VaultNote[]) {
  localStorage.setItem(`${STORAGE_KEY}:${userId}`, JSON.stringify(notes));
}

const STARTER_QUESTIONS = [
  "Tell me about yourself (keep it under 2 minutes)",
  "Why do you want this role?",
  "Describe a challenge you solved recently",
  "What are your salary expectations?",
  "Do you have questions for us?",
];

export default function InterviewVaultSection() {
  const { userId } = useDashboardContext();
  const [entries, setEntries] = useState<VaultNote[]>([]);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setEntries(loadNotes(userId));
  }, [userId]);

  function addEntry() {
    if (!company.trim()) {
      toast({ title: "Company required", description: "Add a company name for this interview prep.", variant: "error" });
      return;
    }
    const entry: VaultNote = {
      id: crypto.randomUUID(),
      company: company.trim(),
      role: role.trim(),
      questions: STARTER_QUESTIONS.join("\n"),
      notes: notes.trim(),
      updatedAt: new Date().toISOString(),
    };
    const next = [entry, ...entries];
    setEntries(next);
    saveNotes(userId, next);
    setCompany("");
    setRole("");
    setNotes("");
    toast({ title: "Saved to vault", description: `Prep notes for ${entry.company} are ready.`, variant: "success" });
  }

  function removeEntry(id: string) {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    saveNotes(userId, next);
    toast({ title: "Removed", description: "Interview entry deleted from your vault." });
  }

  return (
    <section className="space-y-5" aria-labelledby="vault-heading">
      <header>
        <h1 id="vault-heading" className="text-2xl font-bold tracking-tight">Prep Vault</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Private prep notes stored on this device — questions, answers, and company research.
        </p>
      </header>

      <Card className="wg-dash-section-card">
        <CardHeader>
          <CardTitle className="text-lg">Add interview prep</CardTitle>
          <CardDescription>Track each company you are interviewing with.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Company name" value={company} onChange={(e) => setCompany(e.target.value)} />
            <Input placeholder="Role title (optional)" value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
          <Textarea
            placeholder="Your talking points, research, or STAR stories…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
          <Button type="button" onClick={addEntry}>
            <Plus className="h-4 w-4" />
            Save to vault
          </Button>
        </CardContent>
      </Card>

      <Card className="wg-dash-section-card">
        <CardHeader>
          <CardTitle className="text-lg">Common questions checklist</CardTitle>
          <CardDescription>Practice these out loud before every interview.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {STARTER_QUESTIONS.map((q) => (
              <li key={q} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {q}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {entries.length > 0 ? (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id}>
              <Card className="wg-dash-section-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">{entry.company}</h2>
                      {entry.role ? <p className="text-sm text-muted-foreground">{entry.role}</p> : null}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeEntry(entry.id)}
                      aria-label={`Delete ${entry.company} entry`}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                  {entry.notes ? (
                    <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{entry.notes}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Updated {new Date(entry.updatedAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
