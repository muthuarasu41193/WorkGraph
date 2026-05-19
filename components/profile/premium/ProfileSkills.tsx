"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "../../../lib/supabase";
import { MOCK_SKILL_CATEGORIES, type SkillCategory } from "../../../lib/profile-mock-data";
import {
  emitProfileSaved,
  emitProfileSaveError,
  emitProfileSaveStart,
  onSaveAllRequested,
} from "../../../lib/profile-save-events";
import ProfileCard from "../primitives/ProfileCard";
import SectionHeader from "../primitives/SectionHeader";

type Props = {
  userId: string;
  initialSkills: string[];
};

function skillsToCategories(skills: string[]): SkillCategory[] {
  if (!skills.length) return MOCK_SKILL_CATEGORIES;
  const top = skills.slice(0, 3).map((name, i) => ({
    name,
    endorsements: 12 - i * 2,
    top: true,
  }));
  const rest = skills.slice(3).map((name) => ({ name, endorsements: 4 }));
  return [
    { id: "user", label: "Your skills", skills: top },
    ...(rest.length
      ? [{ id: "more", label: "Additional", skills: rest }]
      : []),
  ];
}

export default function ProfileSkills({ userId, initialSkills }: Props) {
  const [skills, setSkills] = useState(initialSkills);
  const [draft, setDraft] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const categories = useMemo(() => skillsToCategories(skills), [skills]);

  const persist = async (next: string[]) => {
    emitProfileSaveStart("skills");
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("profiles")
      .update({ skills: next, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) {
      emitProfileSaveError("skills", error.message);
      throw error;
    }
    emitProfileSaved("skills");
  };

  useEffect(() => onSaveAllRequested(() => void persist(skills)), [skills]);

  const addSkill = async () => {
    const v = draft.trim();
    if (!v || skills.includes(v)) return;
    const next = [...skills, v];
    setSkills(next);
    setDraft("");
    setShowAdd(false);
    try {
      await persist(next);
    } catch {
      /* toast optional */
    }
  };

  const removeSkill = async (skill: string) => {
    const next = skills.filter((s) => s !== skill);
    setSkills(next);
    try {
      await persist(next);
    } catch {
      /* */
    }
  };

  return (
    <ProfileCard id="skills">
      <SectionHeader
        icon={Sparkles}
        eyebrow="Expertise"
        title="Skills"
        description="Top skills recruiters and ATS systems scan first."
        action={
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--wg-color-border)] text-[var(--wg-color-primary)] hover:bg-[var(--wg-color-surface-variant)]"
            aria-label="Add skill"
          >
            <Plus className="h-4 w-4" />
          </button>
        }
      />

      <AnimatePresence>
        {showAdd ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-4 flex gap-2 overflow-hidden"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void addSkill()}
              placeholder="Add a skill"
              className="flex-1 rounded-xl border border-[var(--wg-color-border)] bg-[var(--wg-color-surface-variant)] px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void addSkill()}
              className="rounded-xl bg-[var(--wg-color-primary)] px-4 py-2 text-sm font-medium text-white"
            >
              Add
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="space-y-6">
        {categories.map((cat) => (
          <div key={cat.id}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--wg-color-text-tertiary)]">
              {cat.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {cat.skills.map((skill) => (
                <motion.span
                  key={skill.name}
                  layout
                  whileHover={{ scale: 1.03 }}
                  className={[
                    "group inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium ring-1 transition",
                    skill.top
                      ? "bg-[var(--wg-color-primary)]/10 text-[var(--wg-color-primary)] ring-[var(--wg-color-primary)]/25"
                      : "bg-[var(--wg-color-surface-variant)] text-[var(--wg-color-text-secondary)] ring-[var(--wg-color-border)]",
                  ].join(" ")}
                >
                  {skill.name}
                  {skill.endorsements > 0 ? (
                    <span className="text-[10px] tabular-nums text-[var(--wg-color-text-tertiary)]">
                      {skill.endorsements}
                    </span>
                  ) : null}
                  {cat.id === "user" || cat.id === "more" ? (
                    <button
                      type="button"
                      onClick={() => void removeSkill(skill.name)}
                      className="opacity-0 transition group-hover:opacity-100"
                      aria-label={`Remove ${skill.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  ) : null}
                  {skill.top ? (
                    <span className="rounded-md bg-[var(--wg-color-primary)]/15 px-1 text-[9px] font-bold uppercase text-[var(--wg-color-primary)]">
                      Top
                    </span>
                  ) : null}
                </motion.span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ProfileCard>
  );
}
