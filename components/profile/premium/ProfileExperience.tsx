"use client";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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
    <article className="relative pl-8 before:absolute before:left-[11px] before:top-8 before:h-[calc(100%-8px)] before:w-px before:bg-border last:before:hidden">
      <span className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-lg bg-muted text-caption font-bold text-primary ring-1 ring-border">
        {initial}
      </span>

      <div className="rounded-lg border border-border bg-muted/40 p-4 transition-shadow hover:shadow-sm">
        <button
          type="button"
          className="flex w-full items-start justify-between gap-3 text-left"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <div>
            <h3 className="font-semibold text-foreground">{item.title || "Role title"}</h3>
            <p className="text-body text-muted-foreground">
              {item.company || "Company"} · {item.duration || "Duration"}
            </p>
          </div>
          <ChevronDown
            className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")}
          />
        </button>

        <div
          className={cn(
            "grid transition-all duration-250 ease-out",
            open ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="space-y-3 border-t border-border pt-4">
              {bullets.length > 0 ? (
                <ul className="list-disc space-y-2 pl-5 text-body text-muted-foreground">
                  {bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-body text-muted-foreground">
                  {item.description || "Add impact bullets in the description field."}
                </p>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  value={item.title}
                  onChange={(e) => onUpdate(index, "title", e.target.value)}
                  placeholder="Title"
                  className="h-8 text-caption"
                />
                <Input
                  value={item.company}
                  onChange={(e) => onUpdate(index, "company", e.target.value)}
                  placeholder="Company"
                  className="h-8 text-caption"
                />
              </div>
              <Textarea
                value={item.description}
                onChange={(e) => onUpdate(index, "description", e.target.value)}
                rows={3}
                placeholder="Achievements (one per line)"
                className="text-caption"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                className="h-auto px-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove role
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
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
          <Button type="button" size="sm" onClick={() => void addItem()}>
            <Plus className="h-3.5 w-3.5" />
            Add role
          </Button>
        }
      />

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-body text-muted-foreground">
          No experience yet. Add your first role to build credibility.
        </p>
      ) : (
        <div className="space-y-6">
          {items.map((item, i) => (
            <ExperienceItem
              key={`${item.company}-${item.title}-${i}`}
              item={item}
              index={i}
              onUpdate={(idx, k, v) => void updateField(idx, k, v)}
              onRemove={(idx) => void removeItem(idx)}
            />
          ))}
        </div>
      )}
    </ProfileCard>
  );
}
