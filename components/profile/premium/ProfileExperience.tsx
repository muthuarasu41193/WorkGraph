"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Briefcase, ChevronDown, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "../../../lib/supabase";
import type { WorkExperience } from "../../../lib/types";
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
  experience: WorkExperience[];
};

function parseBullets(description: string): string[] {
  return description
    .split(/\n|•|·/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function ExperienceItem({
  item,
  index,
  onUpdate,
  onRemove,
}: {
  item: WorkExperience;
  index: number;
  onUpdate: (i: number, key: keyof WorkExperience, v: string) => void;
  onRemove: (i: number) => void;
}) {
  const [open, setOpen] = useState(index === 0);
  const bullets = parseBullets(item.description);
  const initial = (item.company || "C")[0]?.toUpperCase();

  return (
    <motion.article
      layout
      className="relative pl-8 before:absolute before:left-[11px] before:top-8 before:h-[calc(100%-8px)] before:w-px before:bg-[var(--wg-color-border)] last:before:hidden"
    >
      <span className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--wg-color-surface-variant)] text-xs font-bold text-[var(--wg-color-primary)] ring-1 ring-[var(--wg-color-border)]">
        {initial}
      </span>

      <div className="rounded-xl border border-[var(--wg-color-border)] bg-[var(--wg-color-surface-variant)]/50 p-4 transition hover:border-[var(--wg-color-primary)]/30">
        <button
          type="button"
          className="flex w-full items-start justify-between gap-3 text-left"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <motion.div>
            <h3 className="font-semibold text-[var(--wg-color-text-primary)]">{item.title || "Role title"}</h3>
            <p className="text-sm text-[var(--wg-color-text-secondary)]">
              {item.company || "Company"} · {item.duration || "Duration"}
            </p>
          </motion.div>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-5 w-5 text-[var(--wg-color-text-tertiary)]" />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-3 border-t border-[var(--wg-color-border)] pt-4">
                {bullets.length > 0 ? (
                  <ul className="list-disc space-y-1.5 pl-5 text-sm text-[var(--wg-color-text-secondary)]">
                    {bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[var(--wg-color-text-secondary)]">
                    {item.description || "Add impact bullets in the description field."}
                  </p>
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    value={item.title}
                    onChange={(e) => onUpdate(index, "title", e.target.value)}
                    placeholder="Title"
                    className="rounded-lg border border-[var(--wg-color-border)] bg-[var(--wg-color-surface)] px-2 py-1.5 text-xs"
                  />
                  <input
                    value={item.company}
                    onChange={(e) => onUpdate(index, "company", e.target.value)}
                    placeholder="Company"
                    className="rounded-lg border border-[var(--wg-color-border)] bg-[var(--wg-color-surface)] px-2 py-1.5 text-xs"
                  />
                </div>
                <textarea
                  value={item.description}
                  onChange={(e) => onUpdate(index, "description", e.target.value)}
                  rows={3}
                  placeholder="Achievements (one per line)"
                  className="w-full rounded-lg border border-[var(--wg-color-border)] bg-[var(--wg-color-surface)] px-2 py-1.5 text-xs"
                />
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="inline-flex items-center gap-1 text-xs text-[var(--wg-color-error)]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove role
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}

export default function ProfileExperience({ userId, experience }: Props) {
  const [items, setItems] = useState(experience);

  const persist = async (next: WorkExperience[]) => {
    emitProfileSaveStart("experience");
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("profiles")
      .update({ work_experience: next, updated_at: new Date().toISOString() })
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
    } catch {
      /* */
    }
  };

  const addItem = async () => {
    const next = [...items, { title: "", company: "", duration: "", description: "" }];
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
    <ProfileCard id="experience">
      <SectionHeader
        icon={Briefcase}
        eyebrow="Career"
        title="Experience"
        description="Timeline of roles, impact, and achievements."
        action={
          <button
            type="button"
            onClick={() => void addItem()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--wg-color-text-primary)] px-3 py-2 text-xs font-semibold text-[var(--wg-color-surface)]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add role
          </button>
        }
      />

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--wg-color-border)] p-8 text-center text-sm text-[var(--wg-color-text-tertiary)]">
          No experience yet. Add your first role to build credibility.
        </p>
      ) : (
        <motion.div className="space-y-6" layout>
          {items.map((item, i) => (
            <ExperienceItem
              key={`${item.company}-${item.title}-${i}`}
              item={item}
              index={i}
              onUpdate={(idx, k, v) => void updateField(idx, k, v)}
              onRemove={(idx) => void removeItem(idx)}
            />
          ))}
        </motion.div>
      )}
    </ProfileCard>
  );
}
