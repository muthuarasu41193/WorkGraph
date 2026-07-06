"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, MapPin, Pencil, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
    emitProfileSaveStart("photo");
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
      emitProfileSaved("photo");
      showToast("Photo updated successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update photo";
      emitProfileSaveError("photo", message);
      showToast(message);
    } finally {
      setIsUploading(false);
    }
  };

  const saveProfileBasics = async () => {
    setIsSaving(true);
    emitProfileSaveStart("header");
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
      emitProfileSaved("header");
      showToast("Profile details updated");
    } catch (error) {
      emitProfileSaveError(
        "header",
        error instanceof Error ? error.message : "Failed to update profile details"
      );
      showToast(error instanceof Error ? error.message : "Failed to update profile details");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    return onSaveAllRequested(() => {
      if (isEditing) {
        void saveProfileBasics();
      } else {
        emitProfileSaved("header");
      }
    });
  }, [isEditing]);

  return (
    <section className="rounded-xl border border-[var(--border-default)] bg-surface-primary p-6">
      {toast ? (
        <div className="fixed right-6 top-6 z-50 rounded-lg border border-border bg-surface-primary px-4 py-2 text-body text-text-primary shadow-md">
          {toast}
        </div>
      ) : null}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => fileRef.current?.click()}
          aria-label={isUploading ? "Uploading profile photo" : "Upload or change profile photo"}
          className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-full p-0 ring-4 ring-success/20 hover:bg-transparent sm:h-28 sm:w-28"
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
            <div className="flex h-full w-full items-center justify-center bg-primary text-heading-xl text-primary-foreground">
              {initials}
            </div>
          )}

          <div className="absolute inset-0 hidden items-center justify-center bg-black/35 text-center text-caption font-medium text-white group-hover:flex">
            <div className="flex flex-col items-center gap-1">
              <Camera className="h-4 w-4" />
              <span>{isUploading ? "Uploading..." : "Change Photo"}</span>
            </div>
          </div>
        </Button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files?.[0])}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <Input
                  value={form.full_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Your full name"
                  size="lg"
                  className="text-heading-s font-semibold"
                />
              ) : (
                <h1 className="text-heading-xl text-[var(--text-primary)]">{form.full_name || "Your Name"}</h1>
              )}
            </div>

            {!isEditing ? (
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setForm({
                    full_name: profile.full_name || "",
                    headline: profile.headline || "",
                    location: profile.location || "",
                    summary: profile.summary || "",
                  });
                  setIsEditing(false);
                }}
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
            )}
          </div>

          {isEditing ? (
            <Input
              value={form.headline}
              onChange={(e) => setForm((prev) => ({ ...prev, headline: e.target.value }))}
              placeholder="Professional headline"
              className="mt-2 font-medium"
            />
          ) : (
            <p className="mt-1 text-body-lg font-semibold text-[var(--text-primary)]">{form.headline || "Add a professional headline"}</p>
          )}

          {isEditing ? (
            <Input
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="Location"
              className="mt-2 font-medium"
            />
          ) : (
            <p className="mt-2 inline-flex items-center gap-1 text-body font-normal text-[var(--text-secondary)]">
              <MapPin className="h-4 w-4" />
              {form.location || "Location not set"}
            </p>
          )}

          {isEditing ? (
            <Textarea
              value={form.summary}
              onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
              placeholder="Write a short professional summary"
              rows={3}
              className="mt-3 font-medium"
            />
          ) : form.summary ? (
            <p className="mt-3 text-body font-normal leading-6 text-[var(--text-secondary)]">{form.summary}</p>
          ) : null}

          {isEditing ? (
            <div className="mt-3 flex justify-end">
              <Button
                type="button"
                size="sm"
                onClick={() => void saveProfileBasics()}
                disabled={isSaving}
                loading={isSaving}
                loadingText="Saving..."
              >
                Save changes
              </Button>
            </div>
          ) : null}

          <div className="mt-4">
            <p className="mb-2 text-body font-medium text-[var(--text-secondary)]">Profile {completeness}% Complete</p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--border-default)]">
              <div className="h-full rounded-full bg-[var(--info)]" style={{ width: `${completeness}%` }} />
            </div>
            <p className="mt-2 text-caption font-normal text-[var(--text-tertiary)]">{getMissingItems(profile)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
