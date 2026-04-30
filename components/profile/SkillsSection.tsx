"use client";

import { useState } from "react";
import { PlusCircle, X } from "lucide-react";
import { createBrowserSupabaseClient } from "../../lib/supabase";

type Props = {
  userId: string;
  initialSkills: string[];
};

export default function SkillsSection({ userId, initialSkills }: Props) {
  const [skills, setSkills] = useState(initialSkills);
  const [showAdd, setShowAdd] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  const persist = async (nextSkills: string[]) => {
    const supabase = createBrowserSupabaseClient();
    await supabase
      .from("profiles")
      .update({ skills: nextSkills, updated_at: new Date().toISOString() })
      .eq("id", userId);
  };

  const addSkill = async () => {
    const value = newSkill.trim();
    if (!value) return;
    if (skills.includes(value)) return;
    const next = [...skills, value];
    setSkills(next);
    setNewSkill("");
    setShowAdd(false);
    await persist(next);
  };

  const removeSkill = async (skill: string) => {
    const next = skills.filter((s) => s !== skill);
    setSkills(next);
    await persist(next);
  };

  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#111827]">Skills</h2>
        <button type="button" onClick={() => setShowAdd((v) => !v)} className="text-[#7C3AED]">
          <PlusCircle className="h-5 w-5" />
        </button>
      </div>

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
            className="flex-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm outline-none"
          />
          <button
            type="button"
            onClick={() => void addSkill()}
            className="rounded-lg bg-[#7C3AED] px-3 py-2 text-sm font-semibold text-white"
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
              className="inline-flex items-center gap-1 rounded-full bg-[#F3F0FF] px-3 py-1 text-sm text-[#7C3AED]"
            >
              {skill}
              <button type="button" onClick={() => void removeSkill(skill)} className="text-[#7C3AED]">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))
        ) : (
          <p className="text-sm text-[#6B7280]">No skills added yet.</p>
        )}
      </div>
    </section>
  );
}
