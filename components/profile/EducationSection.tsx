"use client";

import { useState } from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import { createBrowserSupabaseClient } from "../../lib/supabase";
import type { Education } from "../../lib/types";

type Props = {
  userId: string;
  education: Education[];
};

export default function EducationSection({ userId, education }: Props) {
  const [items, setItems] = useState<Education[]>(education);
  const [toast, setToast] = useState("");

  const persist = async (nextItems: Education[]) => {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("profiles")
      .update({ education: nextItems, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) throw error;
  };

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
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
      {toast ? <p className="mb-3 text-sm text-[#7C3AED]">{toast}</p> : null}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#111827]">Education</h2>
        <button type="button" onClick={() => void addItem()} className="text-[#7C3AED]">
          <PlusCircle className="h-5 w-5" />
        </button>
      </div>
      <div className="space-y-3">
        {items.length ? (
          items.map((item, idx) => (
            <div key={`${item.degree}-${idx}`} className="rounded-lg border border-[#E5E7EB] p-4">
              <div className="mb-2 flex justify-end">
                <button type="button" onClick={() => void removeItem(idx)} className="text-[#9CA3AF] hover:text-[#DC2626]">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <input
                value={item.degree}
                onChange={(e) => void updateField(idx, "degree", e.target.value)}
                placeholder="Degree or program"
                className="w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm font-semibold text-[#111827] outline-none focus:border-[#D1D5DB]"
              />
              <input
                value={item.institution}
                onChange={(e) => void updateField(idx, "institution", e.target.value)}
                placeholder="Institution"
                className="mt-2 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm text-[#6B7280] outline-none focus:border-[#D1D5DB]"
              />
              <input
                value={item.year}
                onChange={(e) => void updateField(idx, "year", e.target.value)}
                placeholder="Year"
                className="mt-2 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-xs text-[#9CA3AF] outline-none focus:border-[#D1D5DB]"
              />
            </div>
          ))
        ) : (
          <p className="text-sm text-[#6B7280]">No education records added yet. Use + to add one.</p>
        )}
      </div>
    </section>
  );
}
