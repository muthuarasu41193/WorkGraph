"use client";

import { useEffect, useState } from "react";
import { PlusCircle, X } from "lucide-react";
import { createBrowserSupabaseClient } from "../../lib/supabase";
import {
  emitProfileSaved,
  emitProfileSaveError,
  emitProfileSaveStart,
  onSaveAllRequested,
} from "../../lib/profile-save-events";

type Props = {
  userId: string;
  initialSkills: string[];
};

export default function SkillsSection({ userId, initialSkills }: Props) {
  const [skills, setSkills] = useState(initialSkills);
  const [showAdd, setShowAdd] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [status, setStatus] = useState("");

  const persist = async (nextSkills: string[]) => {
    emitProfileSaveStart("skills");
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("profiles")
      .update({ skills: nextSkills, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) {
      emitProfileSaveError("skills", error.message);
      throw error;
    }
    emitProfileSaved("skills");
    setStatus("Saved");
    window.setTimeout(() => setStatus(""), 1400);
  };

  useEffect(() => onSaveAllRequested(() => void persist(skills)), [skills]);

  const addSkill = async () => {
    const value = newSkill.trim();
    if (!value) return;
    if (skills.includes(value)) return;
    const next = [...skills, value];
    setSkills(next);
    setNewSkill("");
    setShowAdd(false);
    try {
      await persist(next);
    } catch {
      setStatus("Could not save");
    }
  };

  const removeSkill = async (skill: string) => {
    const next = skills.filter((s) => s !== skill);
    setSkills(next);
    try {
      await persist(next);
    } catch {
      setStatus("Could not save");
    }
  };

  return (
    <section className="rounded-3xl border border-emerald-200/90 bg-white p-6 shadow-[0_18px_55px_-44px_rgba(16,185,129,0.28)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Skills</h2>
          <p className="mt-0.5 text-xs font-semibold text-slate-700">Resume keywords that improve recruiter and ATS visibility.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-emerald-700 transition hover:bg-emerald-100"
        >
          <PlusCircle className="h-5 w-5" />
        </button>
      </div>
      {status ? <p className="mb-3 text-xs font-medium text-emerald-700">{status}</p> : null}

      {showAdd ? (
        <div className="mb-4 flex gap-2">
          <input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void addSkill();
              }
            }}
            placeholder="Add a skill"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm outline-none transition focus:border-emerald-800 focus:bg-white focus:ring-4 focus:ring-emerald-900/12"
          />
          <button
            type="button"
            onClick={() => void addSkill()}
            className="rounded-xl bg-emerald-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-950"
          >
            Add
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {skills.length ? (
          skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-950 ring-1 ring-emerald-200"
            >
              {skill}
              <button type="button" onClick={() => void removeSkill(skill)} className="text-emerald-700">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))
        ) : (
          <p className="text-sm text-slate-600">No skills added yet.</p>
        )}
      </div>
    </section>
  );
}
