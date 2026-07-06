"use client";

import { useEffect, useState } from "react";
import { PlusCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
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
    <section className="rounded-3xl border border-success/20 bg-surface-primary p-6 shadow-[0_18px_55px_-44px_rgba(16,185,129,0.28)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-heading-s text-text-primary">Skills</h2>
          <p className="mt-1 text-caption font-semibold text-text-secondary">Resume keywords that improve recruiter and ATS visibility.</p>
        </div>
        <IconButton
          type="button"
          variant="success"
          iconSize="md"
          onClick={() => setShowAdd((v) => !v)}
          label="Add skill"
          icon={<PlusCircle className="h-5 w-5" />}
        />
      </div>
      {status ? <p className="mb-3 text-caption font-medium text-success-foreground">{status}</p> : null}

      {showAdd ? (
        <div className="mb-4 flex gap-2">
          <Input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void addSkill();
              }
            }}
            placeholder="Add a skill"
            className="flex-1"
          />
          <Button type="button" variant="success" size="sm" onClick={() => void addSkill()}>
            Add
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {skills.length ? (
          skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 rounded-full bg-success-subtle px-3 py-1 text-body font-semibold text-success-foreground ring-1 ring-success/20"
            >
              {skill}
              <IconButton
                type="button"
                variant="ghost"
                iconSize="sm"
                onClick={() => void removeSkill(skill)}
                className="h-auto min-h-0 w-auto min-w-0 p-0 text-success-foreground hover:bg-transparent"
                label={`Remove ${skill}`}
                icon={<X className="h-3.5 w-3.5" />}
              />
            </span>
          ))
        ) : (
          <p className="text-body text-foreground/85">No skills added yet.</p>
        )}
      </div>
    </section>
  );
}
