"use client";

import { useMemo, useRef, useState } from "react";
import { Camera, MapPin, Pencil, X } from "lucide-react";
import Image from "next/image";
import { createBrowserSupabaseClient } from "../../lib/supabase";
import type { Profile } from "../../lib/types";

type Props = {
  profile: Profile;
  userId: string;
};

function getMissingItems(profile: Profile): string {
  const missing: string[] = [];
  if (!profile.summary) missing.push("summary");
  if (!profile.location) missing.push("location");
  if (!profile.skills?.length) missing.push("skills");
  if (!profile.education?.length) missing.push("education");
  if (!profile.work_experience?.length) missing.push("experience");
  return missing.length ? `Missing: ${missing.join(", ")}` : "Great job. Your profile is strong.";
}

export default function ProfileHeader({ profile, userId }: Props) {
  const [photoUrl, setPhotoUrl] = useState(profile.photo_url);
  const [toast, setToast] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: profile.full_name || "",
    headline: profile.headline || "",
    location: profile.location || "",
    summary: profile.summary || "",
  });
  const fileRef = useRef<HTMLInputElement | null>(null);
  const completeness = Math.max(0, Math.min(100, profile.profile_completeness ?? 0));

  const initials = useMemo(() => {
    const base = profile.full_name?.trim() || profile.email || "U";
    return base[0]?.toUpperCase() || "U";
  }, [profile.full_name, profile.email]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const handleUpload = async (file?: File | null) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const path = `${userId}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
        upsert: true,
      });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ photo_url: data.publicUrl, updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (updateError) throw updateError;

      setPhotoUrl(data.publicUrl);
      showToast("Photo updated successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update photo";
      showToast(message);
    } finally {
      setIsUploading(false);
    }
  };

  const saveProfileBasics = async () => {
    setIsSaving(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name.trim() || null,
          headline: form.headline.trim() || null,
          location: form.location.trim() || null,
          summary: form.summary.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      if (error) throw error;
      setIsEditing(false);
      showToast("Profile details updated");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to update profile details");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-3xl border border-emerald-100/90 bg-white p-6 shadow-[0_18px_55px_-44px_rgba(16,185,129,0.28)]">
      {toast ? (
        <div className="fixed right-6 top-6 z-50 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm text-[#111827] shadow-md">
          {toast}
        </div>
      ) : null}

      <div className="flex items-start gap-5">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative h-24 w-24 overflow-hidden rounded-full"
        >
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt="Profile"
              fill
              unoptimized
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-700 text-3xl font-bold text-white">
              {initials}
            </div>
          )}

          <div className="absolute inset-0 hidden items-center justify-center bg-black/35 text-center text-xs font-medium text-white group-hover:flex">
            <div className="flex flex-col items-center gap-1">
              <Camera className="h-4 w-4" />
              <span>{isUploading ? "Uploading..." : "Change Photo"}</span>
            </div>
          </div>
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files?.[0])}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <input
                  value={form.full_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Your full name"
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-lg font-semibold text-[#111827] outline-none focus:border-[#D1D5DB]"
                />
              ) : (
                <h1 className="text-2xl font-bold text-[#111827]">{form.full_name || "Your Name"}</h1>
              )}
            </div>

            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E7EB] px-3 py-1.5 text-xs font-medium text-[#111827]"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setForm({
                    full_name: profile.full_name || "",
                    headline: profile.headline || "",
                    location: profile.location || "",
                    summary: profile.summary || "",
                  });
                  setIsEditing(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E7EB] px-3 py-1.5 text-xs font-medium text-[#6B7280]"
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </button>
            )}
          </div>

          {isEditing ? (
            <input
              value={form.headline}
              onChange={(e) => setForm((prev) => ({ ...prev, headline: e.target.value }))}
              placeholder="Professional headline"
              className="mt-2 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#D1D5DB]"
            />
          ) : (
            <p className="mt-1 text-base text-[#6B7280]">{form.headline || "Add a professional headline"}</p>
          )}

          {isEditing ? (
            <input
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="Location"
              className="mt-2 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#D1D5DB]"
            />
          ) : (
            <p className="mt-2 inline-flex items-center gap-1 text-sm text-[#9CA3AF]">
              <MapPin className="h-4 w-4" />
              {form.location || "Location not set"}
            </p>
          )}

          {isEditing ? (
            <textarea
              value={form.summary}
              onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
              placeholder="Write a short professional summary"
              rows={3}
              className="mt-3 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#D1D5DB]"
            />
          ) : form.summary ? (
            <p className="mt-3 text-sm leading-6 text-[#4B5563]">{form.summary}</p>
          ) : null}

          {isEditing ? (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => void saveProfileBasics()}
                disabled={isSaving}
                className="rounded-md bg-[#111827] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save changes"}
              </button>
            </div>
          ) : null}

          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-[#111827]">Profile {completeness}% Complete</p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600" style={{ width: `${completeness}%` }} />
            </div>
            <p className="mt-2 text-xs text-[#9CA3AF]">{getMissingItems(profile)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
