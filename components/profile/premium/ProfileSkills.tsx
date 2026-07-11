"use client";

import { Plus, Sparkles, X } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "../../../lib/supabase";
import type { SkillCategory } from "../../../lib/profile-mock-data";
import {
  emitProfileSaved,
  emitProfileSaveError,
  emitProfileSaveStart,
  onSaveAllRequested,
} from "../../../lib/profile-save-events";
import ProfileCard from "../primitives/ProfileCard";
import SectionHeader from "../primitives/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Props = {
  userId: string;
  initialSkills: string[];
};

function skillsToCategories(skills: string[]): SkillCategory[] {
  if (!skills.length) return [];
  const top = skills.slice(0, 3).map((name) => ({
    name,
    endorsements: 0,
    top: true,
  }));
  const rest = skills.slice(3).map((name) => ({ name, endorsements: 0 }));
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
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowAdd((v) => !v)}
            aria-label="Add skill"
          >
            <Plus className={iconClass()} />
          </Button>
        }
      />

      {showAdd ? (
        <div className="mb-4 flex gap-2 overflow-hidden transition-all">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void addSkill()}
            placeholder="Add a skill"
            className="flex-1"
          />
          <Button type="button" onClick={() => void addSkill()}>
            Add
          </Button>
        </div>
      ) : null}

      <div className="space-y-6">
        {categories.length === 0 ? (
          <p className="text-sm text-[var(--wg-color-text-tertiary)]">
            No skills added yet. Add skills to improve job matching.
          </p>
        ) : null}
        {categories.map((cat) => (
          <div key={cat.id}>
            <p className="mb-2 text-xs font-semibold text-[var(--wg-color-text-tertiary)]">{cat.label}</p>
            <div className="flex flex-wrap gap-2">
              {cat.skills.map((skill) => (
                <Badge
                  key={skill.name}
                  variant={skill.top ? "default" : "outline"}
                  className="group gap-2 px-2.5 py-1 text-sm font-medium transition-colors hover:shadow-sm"
                >
                  {skill.name}
                  {skill.endorsements > 0 ? (
                    <span className="text-[10px] tabular-nums text-muted-foreground">
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
                      <X className={iconClass()} />
                    </button>
                  ) : null}
                  {skill.top ? (
                    <span className="rounded px-1 text-[10px] font-semibold">Top</span>
                  ) : null}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ProfileCard>
  );
}
