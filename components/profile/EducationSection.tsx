"use client";

import { useEffect, useState } from "react";
import { GraduationCap, Plus, Trash2 } from "lucide-react";
import { createBrowserSupabaseClient } from "../../lib/supabase";
import type { Education } from "../../lib/types";
import {
  emitProfileSaved,
  emitProfileSaveError,
  emitProfileSaveStart,
  onSaveAllRequested,
} from "../../lib/profile-save-events";

type Props = {
  userId: string;
  education: Education[];
};

const inputReset =
  "border-0 bg-transparent shadow-none outline-none ring-0 transition placeholder:text-slate-400 focus:ring-0 focus-visible:ring-2 focus-visible:ring-slate-900/15 focus-visible:ring-offset-2 rounded-sm";

export default function EducationSection({ userId, education }: Props) {
  const [items, setItems] = useState<Education[]>(education);
  const [toast, setToast] = useState("");

  const persist = async (nextItems: Education[]) => {
    emitProfileSaveStart("education");
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("profiles")
      .update({ education: nextItems, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) {
      emitProfileSaveError("education", error.message);
      throw error;
    }
    emitProfileSaved("education");
  };

  useEffect(() => onSaveAllRequested(() => void persist(items)), [items]);

  const updateField = async (index: number, key: keyof Education, value: string) => {
    const next = items.map((item, i) => (i === index ? { ...item, [key]: value } : item));
    setItems(next);
    try {
      await persist(next);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Failed to update education");
      window.setTimeout(() => setToast(""), 2000);
    }
  };

  const addItem = async () => {
    const next = [...items, { degree: "", institution: "", year: "" }];
    setItems(next);
    try {
      await persist(next);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Failed to add education");
      window.setTimeout(() => setToast(""), 2000);
    }
  };

  const removeItem = async (index: number) => {
    const next = items.filter((_, i) => i !== index);
    setItems(next);
    try {
      await persist(next);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Failed to remove education");
      window.setTimeout(() => setToast(""), 2000);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-[#FAFAF9] shadow-[0_1px_0_rgba(15,23,42,0.04)]">
      {toast ? (
        <p className="border-b border-amber-200/80 bg-amber-50 px-6 py-2.5 text-sm text-amber-900">{toast}</p>
      ) : null}

      <header className="flex flex-col gap-4 border-b border-slate-200/80 bg-white px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-800">
            <GraduationCap className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Credentials</p>
            <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-900">Education</h2>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-600">
              Degree first, school second — year sits in its own lane so scanners and humans parse it fast.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void addItem()}
          className="inline-flex items-center justify-center gap-2 self-start rounded-[14px] border border-primary bg-primary px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground transition hover:bg-primary/90 sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Add credential
        </button>
      </header>

      <div className="px-2 pb-2 pt-1 sm:px-4 sm:pb-4 sm:pt-2">
        {items.length ? (
          <ul className="divide-y divide-slate-200/90">
            {items.map((item, idx) => (
              <li key={`edu-${idx}`} className="group relative py-4 sm:py-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
                  <div className="flex shrink-0 items-baseline gap-3 sm:w-28 sm:flex-col sm:gap-1">
                    <span className="font-mono text-[11px] font-medium tabular-nums text-slate-400">
                      {(idx + 1).toString().padStart(2, "0")}
                    </span>
                    <input
                      value={item.year}
                      onChange={(e) => void updateField(idx, "year", e.target.value)}
                      placeholder="Year"
                      className={`${inputReset} w-full max-w-[8rem] rounded border border-dashed border-slate-300 bg-white px-2 py-1 font-mono text-[11px] text-slate-800 sm:max-w-none`}
                    />
                  </div>

                  <div className="relative min-w-0 flex-1 pl-0 sm:border-l sm:border-slate-200 sm:pl-6">
                    <button
                      type="button"
                      onClick={() => void removeItem(idx)}
                      className="absolute -top-1 right-0 rounded p-1.5 text-slate-300 opacity-0 transition hover:bg-slate-100 hover:text-red-600 group-hover:opacity-100 sm:top-0"
                      aria-label="Remove education"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <input
                      value={item.degree}
                      onChange={(e) => void updateField(idx, "degree", e.target.value)}
                      placeholder="Degree or program"
                      className={`${inputReset} w-full pr-8 text-base font-semibold text-slate-900 sm:pr-10`}
                    />
                    <input
                      value={item.institution}
                      onChange={(e) => void updateField(idx, "institution", e.target.value)}
                      placeholder="Institution"
                      className={`${inputReset} mt-1.5 w-full pr-8 text-sm text-slate-600 sm:pr-10`}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-6 py-10 text-center text-sm text-slate-500">
            No credentials yet. Use <span className="font-semibold text-slate-700">Add credential</span> to add one.
          </p>
        )}
      </div>
    </section>
  );
}
