"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import VaultExperienceCard from "@/components/vault/VaultExperienceCard";
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
import { filterAndSortVaultBrowse, type VaultSort } from "@/lib/vault/filters";

type Props = {
  initialExperiences: VaultExperienceListItem[];
  loadError?: string | null;
};

export default function VaultMarketplace({ initialExperiences, loadError = null }: Props) {
  const [experiences] = useState(initialExperiences);
  const [query, setQuery] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [interviewRound, setInterviewRound] = useState("");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [rounds, setRounds] = useState<string>("all");
  const [result, setResult] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState<VaultSort>("relevance");

  const filtered = useMemo(() => {
    const browse = experiences.map((exp) => ({
      id: exp.id,
      company: exp.company,
      role: exp.role,
      level: exp.level,
      interview_round: exp.interview_round,
      skills: exp.skills,
      difficulty: exp.difficulty,
      rounds: exp.rounds,
      result: exp.result,
      interview_date: exp.interview_date,
      published_at: exp.published_at,
      updated_at: exp.updated_at,
      content_confirmed_at: exp.content_confirmed_at,
      avg_rating: exp.avg_rating,
      sales_count: exp.sales_count,
    }));
    const ids = new Set(
      filterAndSortVaultBrowse(browse, {
        q: query,
        company,
        role,
        interview_round: interviewRound,
        difficulty:
          difficulty !== "all" ? (difficulty as NonNullable<VaultExperienceListItem["difficulty"]>) : undefined,
        rounds: rounds !== "all" ? Number(rounds) : undefined,
        result: result !== "all" ? (result as NonNullable<VaultExperienceListItem["result"]>) : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        sort,
      }).map((item) => item.id),
    );
    const byId = new Map(experiences.map((exp) => [exp.id, exp]));
    return [...ids].map((id) => byId.get(id)).filter((exp): exp is VaultExperienceListItem => Boolean(exp));
  }, [
    experiences,
    query,
    company,
    role,
    interviewRound,
    difficulty,
    rounds,
    result,
    dateFrom,
    dateTo,
    sort,
  ]);

  const roundOptions = useMemo(() => {
    const set = new Set<string>();
    for (const exp of experiences) {
      if (exp.interview_round?.trim()) set.add(exp.interview_round.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [experiences]);

  const roundCountOptions = useMemo(() => {
    const set = new Set<number>();
    for (const exp of experiences) {
      if (exp.rounds != null) set.add(exp.rounds);
    }
    return [...set].sort((a, b) => a - b);
  }, [experiences]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Interview Vault</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real interview experiences from candidates who got the offer — preview free, unlock the full playbook.
          Match quality is an estimate, not a hiring probability.
        </p>
      </header>

      {loadError ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive" role="alert">
          {loadError}
        </p>
      ) : null}

      <div className="space-y-4 rounded-xl border bg-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search company, role, skills…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search guides"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="filter-company">Company</Label>
            <Input
              id="filter-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Acme"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-role">Role</Label>
            <Input
              id="filter-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Frontend"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-round">Interview round</Label>
            <Select
              value={interviewRound || "all"}
              onValueChange={(value) => setInterviewRound(value === "all" ? "" : value)}
            >
              <SelectTrigger id="filter-round">
                <SelectValue placeholder="All rounds" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All rounds</SelectItem>
                {roundOptions.map((round) => (
                  <SelectItem key={round} value={round}>
                    {round}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
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
          <div className="space-y-1.5">
            <Label htmlFor="filter-rounds">Round count</Label>
            <Select value={rounds} onValueChange={setRounds}>
              <SelectTrigger id="filter-rounds">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {roundCountOptions.map((r) => (
                  <SelectItem key={r} value={String(r)}>
                    {r} rounds
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
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
          <div className="space-y-1.5">
            <Label htmlFor="filter-sort">Sort</Label>
            <Select value={sort} onValueChange={(value) => setSort(value as VaultSort)}>
              <SelectTrigger id="filter-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="freshness">Freshness</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Interview date</Label>
            <div className="flex gap-2">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} aria-label="From date" />
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} aria-label="To date" />
            </div>
          </div>
        </div>
      </div>

      {filtered.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((exp) => (
            <li key={exp.id}>
              <VaultExperienceCard experience={exp} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground" role="status">
          No experiences match your filters yet. Be the first to{" "}
          <Link href="/interview-vault/sell" className="text-primary underline-offset-4 hover:underline">
            sell an experience
          </Link>
          .
        </p>
      )}
    </div>
  );
}
