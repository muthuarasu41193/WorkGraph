"use client";

import { useEffect, useState } from "react";
import { PlusCircle, Trash2 } from "lucide-react";
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
    <section className="rounded-3xl border border-emerald-100/90 bg-white p-6 shadow-[0_18px_55px_-44px_rgba(16,185,129,0.28)]">
      {toast ? <p className="mb-3 text-sm text-emerald-700">{toast}</p> : null}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Education</h2>
          <p className="mt-0.5 text-xs text-slate-500">Degrees, schools, certifications, and years.</p>
        </div>
        <button
          type="button"
          onClick={() => void addItem()}
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-emerald-700 transition hover:bg-emerald-100"
        >
          <PlusCircle className="h-5 w-5" />
        </button>
      </div>
      <div className="space-y-3">
        {items.length ? (
          items.map((item, idx) => (
            <div key={`${item.degree}-${idx}`} className="rounded-xl border border-slate-200 bg-slate-50/35 p-4">
              <div className="mb-2 flex justify-end">
                <button type="button" onClick={() => void removeItem(idx)} className="text-slate-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <input
                value={item.degree}
                onChange={(e) => void updateField(idx, "degree", e.target.value)}
                placeholder="Degree or program"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-800 focus:ring-4 focus:ring-emerald-900/12"
              />
              <input
                value={item.institution}
                onChange={(e) => void updateField(idx, "institution", e.target.value)}
                placeholder="Institution"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-emerald-800 focus:ring-4 focus:ring-emerald-900/12"
              />
              <input
                value={item.year}
                onChange={(e) => void updateField(idx, "year", e.target.value)}
                placeholder="Year"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 outline-none transition focus:border-emerald-800 focus:ring-4 focus:ring-emerald-900/12"
              />
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-600">No education records added yet. Use + to add one.</p>
        )}
      </div>
    </section>
  );
}
