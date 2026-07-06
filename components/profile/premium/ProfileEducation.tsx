"use client";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
          <Button type="button" variant="outline" size="sm" onClick={() => void addItem()}>
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        }
      />

      <div className="space-y-4">
        {items.map((item, i) => (
          <div
            key={`edu-${i}`}
            className="flex gap-4 rounded-xl border border-border p-4 transition-shadow hover:shadow-sm"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
              <GraduationCap className="h-5 w-5 text-primary" />
            </span>
            <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-3">
              <Input
                value={item.degree}
                onChange={(e) => void updateField(i, "degree", e.target.value)}
                placeholder="Degree"
                className="border-transparent bg-transparent font-semibold shadow-none focus-visible:border-input"
              />
              <Input
                value={item.institution}
                onChange={(e) => void updateField(i, "institution", e.target.value)}
                placeholder="Institution"
                className="border-transparent bg-transparent text-body text-muted-foreground shadow-none focus-visible:border-input"
              />
              <Input
                value={item.year}
                onChange={(e) => void updateField(i, "year", e.target.value)}
                placeholder="Year"
                className="border-transparent bg-transparent text-body tabular-nums text-muted-foreground shadow-none focus-visible:border-input"
              />
            </div>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => void removeItem(i)} aria-label="Remove">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
      </div>

      {certifications.length > 0 ? (
        <div className="mt-8 border-t border-border pt-6">
          <p className="mb-3 flex items-center gap-2 text-caption font-semibold uppercase tracking-wider text-muted-foreground">
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
