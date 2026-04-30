"use client";

import { useState, type ReactNode } from "react";
import { GitBranch, Globe, Link2 } from "lucide-react";
import { createBrowserSupabaseClient } from "../../lib/supabase";
import type { Profile } from "../../lib/types";

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

  const saveField = async (field: FieldKey) => {
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase
        .from("profiles")
        .update({ [field]: values[field] || null, updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (error) throw error;
      setEditing(null);
      setToast("Links updated");
      window.setTimeout(() => setToast(""), 1800);
    } catch (error) {
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
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
      {toast ? <p className="mb-3 text-sm text-[#7C3AED]">{toast}</p> : null}
      <h2 className="mb-4 text-lg font-semibold text-[#111827]">Links</h2>

      <div className="space-y-3">
        {rows.map((row) => {
          const isEditing = editing === row.key;
          return (
            <div key={row.key} className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] p-3">
              <div>{row.icon}</div>
              <input
                value={values[row.key]}
                disabled={!isEditing}
                onChange={(e) => setValues((prev) => ({ ...prev, [row.key]: e.target.value }))}
                placeholder={row.placeholder}
                className="flex-1 border-none bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
              />
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setEditing(row.key)}
                  className="rounded-md border border-[#E5E7EB] px-3 py-1.5 text-xs font-medium text-[#111827]"
                >
                  Edit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => saveField(row.key)}
                  className="rounded-md bg-[#7C3AED] px-3 py-1.5 text-xs font-semibold text-white"
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
