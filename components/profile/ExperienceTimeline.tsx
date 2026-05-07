"use client";

import { useEffect, useState } from "react";
import { PlusCircle, Trash2 } from "lucide-react";
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
    <section className="rounded-3xl border border-emerald-200/90 bg-white p-6 shadow-[0_18px_55px_-44px_rgba(16,185,129,0.28)]">
      {toast ? <p className="mb-3 text-sm text-emerald-700">{toast}</p> : null}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Work experience</h2>
          <p className="mt-0.5 text-xs font-semibold text-slate-700">Parsed experience: role, company, duration, outcomes.</p>
        </div>
        <button
          type="button"
          onClick={() => void addItem()}
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-emerald-700 transition hover:bg-emerald-100"
        >
          <PlusCircle className="h-5 w-5" />
        </button>
      </div>

      <ol className="relative space-y-5 border-l border-emerald-100 pl-5">
        {items.map((item, idx) => (
          <li key={`${item.title}-${idx}`} className="relative">
            <span className="absolute -left-[25px] top-1.5 h-3 w-3 rounded-full bg-emerald-600" />
            <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
              <div className="mb-2 flex justify-end">
                <button type="button" onClick={() => void removeItem(idx)} className="text-slate-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <input
                value={item.title}
                onChange={(e) => void updateField(idx, "title", e.target.value)}
                placeholder="Job title"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-800 focus:ring-4 focus:ring-emerald-900/12"
              />
              <input
                value={item.company}
                onChange={(e) => void updateField(idx, "company", e.target.value)}
                placeholder="Company"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-800 focus:ring-4 focus:ring-emerald-900/12"
              />
              <input
                value={item.duration}
                onChange={(e) => void updateField(idx, "duration", e.target.value)}
                placeholder="Duration (e.g., 2021 - Present)"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition focus:border-emerald-800 focus:ring-4 focus:ring-emerald-900/12"
              />
              <textarea
                value={item.description}
                onChange={(e) => void updateField(idx, "description", e.target.value)}
                placeholder="Describe impact, responsibilities, outcomes"
                rows={3}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium leading-6 text-slate-800 outline-none transition focus:border-emerald-800 focus:ring-4 focus:ring-emerald-900/12"
              />
            </div>
          </li>
        ))}
      </ol>

      {!items.length ? (
        <p className="mt-4 text-sm text-slate-600">No experience added yet. Use + to add your first role.</p>
      ) : null}
    </section>
  );
}
