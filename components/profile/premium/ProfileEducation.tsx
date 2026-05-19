"use client";

import { motion } from "framer-motion";
import { Award, GraduationCap, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "../../../lib/supabase";
import type { Education } from "../../../lib/types";
import {
  emitProfileSaved,
  emitProfileSaveError,
  emitProfileSaveStart,
  onSaveAllRequested,
} from "../../../lib/profile-save-events";
import ProfileCard from "../primitives/ProfileCard";
import ProfileBadge from "../primitives/ProfileBadge";
import SectionHeader from "../primitives/SectionHeader";

type Props = {
  userId: string;
  education: Education[];
  certifications: string[];
};

export default function ProfileEducation({ userId, education, certifications }: Props) {
  const [items, setItems] = useState(education);

  const persist = async (next: Education[]) => {
    emitProfileSaveStart("education");
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("profiles")
      .update({ education: next, updated_at: new Date().toISOString() })
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
    } catch {
      /* */
    }
  };

  const addItem = async () => {
    const next = [...items, { degree: "", institution: "", year: "" }];
    setItems(next);
    try {
      await persist(next);
    } catch {
      /* */
    }
  };

  const removeItem = async (index: number) => {
    const next = items.filter((_, i) => i !== index);
    setItems(next);
    try {
      await persist(next);
    } catch {
      /* */
    }
  };

  return (
    <ProfileCard id="education">
      <SectionHeader
        icon={GraduationCap}
        eyebrow="Academics"
        title="Education & certifications"
        description="Degrees, institutions, and credentials that validate your expertise."
        action={
          <button
            type="button"
            onClick={() => void addItem()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--wg-color-border)] px-3 py-2 text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        }
      />

      <div className="space-y-4">
        {items.map((item, i) => (
          <motion.div
            key={`edu-${i}`}
            whileHover={{ x: 2 }}
            className="flex gap-4 rounded-xl border border-[var(--wg-color-border)] p-4"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--wg-color-surface-variant)]">
              <GraduationCap className="h-5 w-5 text-[var(--wg-color-primary)]" />
            </span>
            <motion.div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-3">
              <input
                value={item.degree}
                onChange={(e) => void updateField(i, "degree", e.target.value)}
                placeholder="Degree"
                className="rounded-lg border border-transparent bg-transparent px-1 font-semibold focus:border-[var(--wg-color-border)]"
              />
              <input
                value={item.institution}
                onChange={(e) => void updateField(i, "institution", e.target.value)}
                placeholder="Institution"
                className="text-sm text-[var(--wg-color-text-secondary)] focus:border-[var(--wg-color-border)] rounded-lg border border-transparent"
              />
              <input
                value={item.year}
                onChange={(e) => void updateField(i, "year", e.target.value)}
                placeholder="Year"
                className="text-sm tabular-nums text-[var(--wg-color-text-tertiary)] focus:border-[var(--wg-color-border)] rounded-lg border border-transparent"
              />
            </motion.div>
            <button type="button" onClick={() => void removeItem(i)} aria-label="Remove">
              <Trash2 className="h-4 w-4 text-[var(--wg-color-text-tertiary)]" />
            </button>
          </motion.div>
        ))}
      </div>

      {certifications.length > 0 ? (
        <div className="mt-8 border-t border-[var(--wg-color-border)] pt-6">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--wg-color-text-tertiary)]">
            <Award className="h-4 w-4" />
            Certifications
          </p>
          <div className="flex flex-wrap gap-2">
            {certifications.map((c) => (
              <ProfileBadge key={c} tone="success">
                {c}
              </ProfileBadge>
            ))}
          </div>
        </div>
      ) : null}
    </ProfileCard>
  );
}
