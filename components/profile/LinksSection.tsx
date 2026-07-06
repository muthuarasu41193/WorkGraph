"use client";

import { useEffect, useState, type ReactNode } from "react";
import { GitBranch, Globe, Link2 } from "lucide-react";
import { createBrowserSupabaseClient } from "../../lib/supabase";
import type { Profile } from "../../lib/types";
import {
  emitProfileSaved,
  emitProfileSaveError,
  emitProfileSaveStart,
  onSaveAllRequested,
} from "../../lib/profile-save-events";

type Props = {
  profile: Profile;
  userId: string;
};

type FieldKey = "linkedin_url" | "github_url" | "website_url" | "stackoverflow_url";

function StackOverflowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.986 21.865v-6.404h2.134V24H1.844v-8.539h2.13v6.404h15.012zM6.111 15.573l11.39-2.462 0.455 2.11-11.39 2.462-0.455-2.11zm1.359-5.362L18.76 6.32l0.911 1.984L8.381 12.195l-0.911-1.984zm2.683-4.918l10.044 4.605 0.911-1.984L10.064 3.31l-0.911 1.983z" />
    </svg>
  );
}

export default function LinksSection({ profile, userId }: Props) {
  const [values, setValues] = useState<Record<FieldKey, string>>({
    linkedin_url: profile.linkedin_url || "",
    github_url: profile.github_url || "",
    website_url: profile.website_url || "",
    stackoverflow_url: profile.stackoverflow_url || "",
  });
  const [editing, setEditing] = useState<FieldKey | null>(null);
  const [toast, setToast] = useState("");

  const saveAll = async () => {
    emitProfileSaveStart("links");
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase
        .from("profiles")
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (error) throw error;
      setEditing(null);
      emitProfileSaved("links");
      setToast("Links saved");
      window.setTimeout(() => setToast(""), 1800);
    } catch (error) {
      emitProfileSaveError("links", error instanceof Error ? error.message : "Failed to save links");
      setToast(error instanceof Error ? error.message : "Failed to save links");
      window.setTimeout(() => setToast(""), 2200);
    }
  };

  useEffect(() => onSaveAllRequested(() => void saveAll()), [values, userId]);

  const saveField = async (field: FieldKey) => {
    emitProfileSaveStart("links");
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase
        .from("profiles")
        .update({ [field]: values[field] || null, updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (error) throw error;
      setEditing(null);
      emitProfileSaved("links");
      setToast("Links updated");
      window.setTimeout(() => setToast(""), 1800);
    } catch (error) {
      emitProfileSaveError("links", error instanceof Error ? error.message : "Failed to update link");
      setToast(error instanceof Error ? error.message : "Failed to update link");
      window.setTimeout(() => setToast(""), 2200);
    }
  };

  const rows: Array<{ key: FieldKey; label: string; icon: ReactNode; placeholder: string }> = [
    {
      key: "linkedin_url",
      label: "LinkedIn",
      icon: <Link2 className="h-4 w-4 text-[var(--text-tertiary)]" />,
      placeholder: "https://linkedin.com/in/yourname",
    },
    {
      key: "github_url",
      label: "GitHub",
      icon: <GitBranch className="h-4 w-4 text-[var(--text-tertiary)]" />,
      placeholder: "https://github.com/yourname",
    },
    {
      key: "website_url",
      label: "Website",
      icon: <Globe className="h-4 w-4 text-[var(--text-tertiary)]" />,
      placeholder: "https://yourwebsite.com",
    },
    {
      key: "stackoverflow_url",
      label: "Stack Overflow",
      icon: <StackOverflowIcon className="h-4 w-4 text-[var(--text-tertiary)]" />,
      placeholder: "https://stackoverflow.com/users/…",
    },
  ];

  return (
    <section className="rounded-xl border border-[var(--border-default)] bg-surface-primary p-6">
      {toast ? <p className="mb-3 text-body text-[var(--info)]">{toast}</p> : null}
      <h2 className="mb-1 text-title font-semibold text-[var(--text-primary)]">Links</h2>
      <p className="mb-4 text-caption font-normal text-[var(--text-tertiary)]">
        Keep your public profiles up-to-date — they are included when you apply to jobs.
      </p>

      <div className="space-y-3">
        {rows.map((row) => {
          const isEditing = editing === row.key;
          return (
            <div key={row.key} className="flex items-center gap-3 rounded-xl border border-[var(--border-default)] bg-surface-primary p-3">
              <div>{row.icon}</div>
              <input
                value={values[row.key]}
                disabled={!isEditing}
                onChange={(e) => setValues((prev) => ({ ...prev, [row.key]: e.target.value }))}
                placeholder={row.placeholder}
                className="flex-1 border-none bg-transparent text-body font-normal text-[var(--text-secondary)] outline-none placeholder:text-[var(--text-tertiary)]"
              />
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setEditing(row.key)}
                  className="rounded-lg border border-[var(--border-default)] bg-surface-primary px-3 py-2 text-caption font-medium text-[var(--text-secondary)] transition hover:shadow-sm"
                >
                  Edit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => saveField(row.key)}
                  className="rounded-lg bg-[var(--info)] px-3 py-2 text-caption font-medium text-white transition hover:bg-[var(--info-foreground)]"
                >
                  Save
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
