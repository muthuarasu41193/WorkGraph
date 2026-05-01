"use client";

import { useState } from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import { createBrowserSupabaseClient } from "../../lib/supabase";
import type { WorkExperience } from "../../lib/types";

type Props = {
  userId: string;
  experience: WorkExperience[];
};

export default function ExperienceTimeline({ userId, experience }: Props) {
  const [items, setItems] = useState<WorkExperience[]>(experience);
  const [toast, setToast] = useState("");

  const persist = async (nextItems: WorkExperience[]) => {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("profiles")
      .update({ work_experience: nextItems, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) throw error;
  };

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
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
      {toast ? <p className="mb-3 text-sm text-[#7C3AED]">{toast}</p> : null}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#111827]">Work Experience</h2>
        <button type="button" onClick={() => void addItem()} className="text-[#7C3AED]">
          <PlusCircle className="h-5 w-5" />
        </button>
      </div>

      <ol className="relative space-y-5 border-l border-[#E5E7EB] pl-5">
        {items.map((item, idx) => (
          <li key={`${item.title}-${idx}`} className="relative">
            <span className="absolute -left-[25px] top-1.5 h-3 w-3 rounded-full bg-[#7C3AED]" />
            <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
              <div className="mb-2 flex justify-end">
                <button type="button" onClick={() => void removeItem(idx)} className="text-[#9CA3AF] hover:text-[#DC2626]">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <input
                value={item.title}
                onChange={(e) => void updateField(idx, "title", e.target.value)}
                placeholder="Job title"
                className="w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm font-semibold text-[#111827] outline-none focus:border-[#D1D5DB]"
              />
              <input
                value={item.company}
                onChange={(e) => void updateField(idx, "company", e.target.value)}
                placeholder="Company"
                className="mt-2 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm text-[#6B7280] outline-none focus:border-[#D1D5DB]"
              />
              <input
                value={item.duration}
                onChange={(e) => void updateField(idx, "duration", e.target.value)}
                placeholder="Duration (e.g., 2021 - Present)"
                className="mt-2 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-xs text-[#6B7280] outline-none focus:border-[#D1D5DB]"
              />
              <textarea
                value={item.description}
                onChange={(e) => void updateField(idx, "description", e.target.value)}
                placeholder="Describe impact, responsibilities, outcomes"
                rows={3}
                className="mt-2 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm leading-6 text-[#6B7280] outline-none focus:border-[#D1D5DB]"
              />
            </div>
          </li>
        ))}
      </ol>

      {!items.length ? (
        <p className="mt-4 text-sm text-[#6B7280]">No experience added yet. Use + to add your first role.</p>
      ) : null}
    </section>
  );
}
