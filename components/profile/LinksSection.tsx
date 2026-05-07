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

type FieldKey = "linkedin_url" | "github_url" | "website_url";

export default function LinksSection({ profile, userId }: Props) {
  const [values, setValues] = useState<Record<FieldKey, string>>({
    linkedin_url: profile.linkedin_url || "",
    github_url: profile.github_url || "",
    website_url: profile.website_url || "",
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
      icon: <Link2 className="h-4 w-4 text-[#6B7280]" />,
      placeholder: "https://linkedin.com/in/yourname",
    },
    {
      key: "github_url",
      label: "GitHub",
      icon: <GitBranch className="h-4 w-4 text-[#6B7280]" />,
      placeholder: "https://github.com/yourname",
    },
    {
      key: "website_url",
      label: "Website",
      icon: <Globe className="h-4 w-4 text-[#6B7280]" />,
      placeholder: "https://yourwebsite.com",
    },
  ];

  return (
    <section className="rounded-3xl border border-emerald-100/90 bg-white p-6 shadow-[0_18px_55px_-44px_rgba(16,185,129,0.28)]">
      {toast ? <p className="mb-3 text-sm text-emerald-700">{toast}</p> : null}
      <h2 className="mb-1 text-lg font-semibold text-slate-900">Links</h2>
      <p className="mb-4 text-xs text-slate-500">Keep your public profiles up-to-date for recruiters.</p>

      <div className="space-y-3">
        {rows.map((row) => {
          const isEditing = editing === row.key;
          return (
            <div key={row.key} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
              <div>{row.icon}</div>
              <input
                value={values[row.key]}
                disabled={!isEditing}
                onChange={(e) => setValues((prev) => ({ ...prev, [row.key]: e.target.value }))}
                placeholder={row.placeholder}
                className="flex-1 border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setEditing(row.key)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800"
                >
                  Edit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => saveField(row.key)}
                  className="rounded-lg bg-emerald-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-950"
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
