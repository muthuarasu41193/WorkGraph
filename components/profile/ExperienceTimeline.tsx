"use client";

import { useEffect, useState } from "react";
import { Briefcase, Plus, Trash2 } from "lucide-react";
import { createBrowserSupabaseClient } from "../../lib/supabase";
import type { WorkExperience } from "../../lib/types";
import {
  emitProfileSaved,
  emitProfileSaveError,
  emitProfileSaveStart,
  onSaveAllRequested,
} from "../../lib/profile-save-events";

type Props = {
  userId: string;
  experience: WorkExperience[];
};

const inputReset =
  "border-0 bg-transparent shadow-none outline-none ring-0 transition placeholder:text-text-tertiary focus:ring-0 focus-visible:ring-2 focus-visible:ring-border-strong focus-visible:ring-offset-2 rounded-sm";

export default function ExperienceTimeline({ userId, experience }: Props) {
  const [items, setItems] = useState<WorkExperience[]>(experience);
  const [toast, setToast] = useState("");

  const persist = async (nextItems: WorkExperience[]) => {
    emitProfileSaveStart("experience");
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("profiles")
      .update({ work_experience: nextItems, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) {
      emitProfileSaveError("experience", error.message);
      throw error;
    }
    emitProfileSaved("experience");
  };

  useEffect(() => onSaveAllRequested(() => void persist(items)), [items]);

  const updateField = async (index: number, key: keyof WorkExperience, value: string) => {
    const next = items.map((item, i) => (i === index ? { ...item, [key]: value } : item));
    setItems(next);
    try {
      await persist(next);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Failed to update experience");
      window.setTimeout(() => setToast(""), 2000);
    }
  };

  const addItem = async () => {
    const next = [...items, { title: "", company: "", duration: "", description: "" }];
    setItems(next);
    try {
      await persist(next);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Failed to add experience");
      window.setTimeout(() => setToast(""), 2000);
    }
  };

  const removeItem = async (index: number) => {
    const next = items.filter((_, i) => i !== index);
    setItems(next);
    try {
      await persist(next);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Failed to remove experience");
      window.setTimeout(() => setToast(""), 2000);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-border/90 bg-surface-page shadow-sm">
      {toast ? (
        <p className="border-b border-warning/20/80 bg-warning-subtle px-6 py-2.5 text-sm text-warning-foreground">{toast}</p>
      ) : null}

      <header className="flex flex-col gap-4 border-b border-border/80 bg-surface-primary px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-secondary text-foreground">
            <Briefcase className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Career arc</p>
            <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-foreground">Roles & impact</h2>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-foreground/85">
              One block per position — title and company read like a résumé line; details stay in the margin note.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void addItem()}
          className="inline-flex items-center justify-center gap-2 self-start rounded-[14px] border border-primary bg-primary px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground transition hover:bg-primary/90 sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Add role
        </button>
      </header>

      <div className="px-2 pb-2 pt-1 sm:px-4 sm:pb-4 sm:pt-2">
        <ol className="divide-y divide-border">
          {items.map((item, idx) => (
            <li key={`exp-${idx}`} className="group relative">
              <div className="flex gap-0 sm:gap-1">
                <div className="flex w-11 shrink-0 flex-col items-center pt-6 sm:w-14 sm:pt-7">
                  <span className="font-mono text-[length:var(--font-size-label)] font-medium tabular-nums text-text-tertiary">
                    {(idx + 1).toString().padStart(2, "0")}
                  </span>
                </div>

                <div className="relative min-w-0 flex-1 border-l-2 border-text-primary py-5 pl-4 pr-10 sm:pl-6 sm:pr-12">
                  <button
                    type="button"
                    onClick={() => void removeItem(idx)}
                    className="absolute right-2 top-5 rounded p-1.5 text-text-tertiary opacity-0 transition hover:bg-surface-secondary hover:text-red-600 group-hover:opacity-100"
                    aria-label="Remove role"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
                    <div className="min-w-0 flex-1 space-y-2">
                      <input
                        value={item.title}
                        onChange={(e) => void updateField(idx, "title", e.target.value)}
                        placeholder="Role title"
                        className={`${inputReset} w-full text-lg font-semibold tracking-tight text-foreground`}
                      />
                      <input
                        value={item.company}
                        onChange={(e) => void updateField(idx, "company", e.target.value)}
                        placeholder="Organization"
                        className={`${inputReset} w-full text-xs font-semibold uppercase tracking-[0.14em] text-foreground/85`}
                      />
                    </div>
                    <input
                      value={item.duration}
                      onChange={(e) => void updateField(idx, "duration", e.target.value)}
                      placeholder="Timeline"
                      className={`${inputReset} w-full shrink-0 rounded border border-border bg-surface-primary px-2.5 py-1.5 font-mono text-[length:var(--font-size-label)] text-foreground lg:max-w-[11rem] lg:text-right`}
                    />
                  </div>

                  <textarea
                    value={item.description}
                    onChange={(e) => void updateField(idx, "description", e.target.value)}
                    placeholder="Outcomes, scope, tech — tight bullets read best."
                    rows={3}
                    className={`${inputReset} mt-4 w-full resize-y border-l-2 border-border pl-3 text-sm leading-relaxed text-text-secondary transition-colors focus-visible:border-text-primary`}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>

        {!items.length ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            No roles yet. Use <span className="font-semibold text-text-secondary">Add role</span> to start your timeline.
          </p>
        ) : null}
      </div>
    </section>
  );
}
