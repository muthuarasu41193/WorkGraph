"use client";

import { useMemo, useState } from "react";
import VaultExperienceCard from "@/components/vault/VaultExperienceCard";
import PageHeader from "@/components/design-system/PageHeader";
import { AppShell } from "@/components/layout";
import { Search } from "@/components/ui/search";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  VAULT_DIFFICULTIES,
  VAULT_DIFFICULTY_LABELS,
  VAULT_RESULTS,
  VAULT_RESULT_LABELS,
  type VaultExperienceListItem,
} from "@/lib/vault";

type Props = {
  initialExperiences: VaultExperienceListItem[];
};

export default function VaultMarketplace({ initialExperiences }: Props) {
  const [experiences] = useState(initialExperiences);
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [rounds, setRounds] = useState<string>("all");
  const [result, setResult] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return experiences.filter((exp) => {
      if (q) {
        const hay = `${exp.company} ${exp.role} ${exp.level ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (difficulty !== "all" && exp.difficulty !== difficulty) return false;
      if (rounds !== "all" && String(exp.rounds ?? "") !== rounds) return false;
      if (result !== "all" && exp.result !== result) return false;
      if (dateFrom && exp.interview_date && exp.interview_date < dateFrom) return false;
      if (dateTo && exp.interview_date && exp.interview_date > dateTo) return false;
      return true;
    });
  }, [experiences, query, difficulty, rounds, result, dateFrom, dateTo]);

  const roundOptions = useMemo(() => {
    const set = new Set<number>();
    for (const exp of experiences) {
      if (exp.rounds != null) set.add(exp.rounds);
    }
    return [...set].sort((a, b) => a - b);
  }, [experiences]);

  return (
    <AppShell.Page>
      <PageHeader
        pinned
        breadcrumbs={[
          { label: "Interview Vault", href: "/interview-vault" },
          { label: "Marketplace" },
        ]}
        title="Interview Vault"
        subtitle="Real interview experiences from candidates who got the offer — preview free, unlock the full playbook."
      />

      <AppShell.Filters sticky={false} padding={false}>
        <div className="space-y-4 rounded-xl border bg-card p-4">
        <Search
          placeholder="Search company, role, or level…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="filter-difficulty">Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger id="filter-difficulty">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {VAULT_DIFFICULTIES.map((d) => (
                  <SelectItem key={d} value={d}>
                    {VAULT_DIFFICULTY_LABELS[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-rounds">Rounds</Label>
            <Select value={rounds} onValueChange={setRounds}>
              <SelectTrigger id="filter-rounds">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {roundOptions.map((r) => (
                  <SelectItem key={r} value={String(r)}>
                    {r} rounds
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-result">Result</Label>
            <Select value={result} onValueChange={setResult}>
              <SelectTrigger id="filter-result">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {VAULT_RESULTS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {VAULT_RESULT_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <Label>Interview date</Label>
            <div className="flex gap-2">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} aria-label="From date" />
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} aria-label="To date" />
            </div>
          </div>
        </div>
        </div>
      </AppShell.Filters>

      <AppShell.Content constrained={false} className="space-y-6">
        {filtered.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((exp) => (
              <li key={exp.id}>
                <VaultExperienceCard experience={exp} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed p-8 text-center text-body text-muted-foreground">
            No experiences match your filters yet. Be the first to{" "}
            <a href="/interview-vault/sell" className="text-primary underline-offset-4 hover:underline">
              sell an experience
            </a>
            .
          </p>
        )}
      </AppShell.Content>
    </AppShell.Page>
  );
}
