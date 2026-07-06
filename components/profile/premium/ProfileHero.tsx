"use client";

import {
  Briefcase,
  Camera,
  Download,
  Github,
  Globe,
  Linkedin,
  MapPin,
  Pencil,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createBrowserSupabaseClient } from "../../../lib/supabase";
import type { Profile } from "../../../lib/types";
import {
  emitProfileSaved,
  emitProfileSaveError,
  emitProfileSaveStart,
  onSaveAllRequested,
} from "../../../lib/profile-save-events";
import ProfileBadge from "../primitives/ProfileBadge";
import ProfileButton from "../primitives/ProfileButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  profile: Profile;
  userId: string;
  openToWork?: boolean;
};

const inputClass =
  "border-border bg-background focus-visible:ring-primary/20";

export default function ProfileHero({ profile, userId, openToWork = true }: Props) {
  const [photoUrl, setPhotoUrl] = useState(profile.photo_url);
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

  const initials = useMemo(() => {
    const base = profile.full_name?.trim() || profile.email || "U";
    return base
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [profile.full_name, profile.email]);

  const years =
    profile.years_of_experience != null
      ? `${profile.years_of_experience}+ years`
      : "Experience not set";

  const saveBasics = async () => {
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
    } catch (e) {
      emitProfileSaveError("header", e instanceof Error ? e.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => onSaveAllRequested(() => { if (isEditing) void saveBasics(); }), [isEditing]);

  const handleUpload = async (file?: File | null) => {
    if (!file) return;
    setIsUploading(true);
    emitProfileSaveStart("photo");
    try {
      const supabase = createBrowserSupabaseClient();
      const path = `${userId}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").update({ photo_url: data.publicUrl }).eq("id", userId);
      setPhotoUrl(data.publicUrl);
      emitProfileSaved("photo");
    } catch (e) {
      emitProfileSaveError("photo", e instanceof Error ? e.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const socials = [
    { href: profile.linkedin_url, icon: Linkedin, label: "LinkedIn" },
    { href: profile.github_url, icon: Github, label: "GitHub" },
    { href: profile.website_url, icon: Globe, label: "Website" },
    { href: profile.email ? `mailto:${profile.email}` : null, icon: Mail, label: "Email" },
  ].filter((s) => s.href);

  return (
    <header className="wg-profile-hero px-5 py-6 sm:px-7 sm:py-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative mx-auto shrink-0 sm:mx-0"
            aria-label="Change profile photo"
          >
            <Avatar className="h-[88px] w-[88px] border-2 border-border">
              {photoUrl ? <AvatarImage src={photoUrl} alt="" /> : null}
              <AvatarFallback className="bg-primary text-heading-s text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-surface-inverse/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-4 w-4 text-white" />
              <span className="sr-only">{isUploading ? "Uploading" : "Upload photo"}</span>
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleUpload(e.target.files?.[0])}
          />

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-caption font-semibold uppercase tracking-[var(--letter-spacing-label)] text-[var(--text-tertiary)]">
              Professional profile
            </p>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {openToWork ? <ProfileBadge tone="success">Open to work</ProfileBadge> : null}
              <ProfileBadge tone="muted">{years}</ProfileBadge>
            </div>

            {isEditing ? (
              <Input
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                className={`${inputClass} mt-3 text-heading-m`}
              />
            ) : (
              <h1 className="mt-2 text-heading-l leading-tight text-foreground">
                {form.full_name || "Your name"}
              </h1>
            )}

            {isEditing ? (
              <Input
                value={form.headline}
                onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
                placeholder="Role / title"
                className={`${inputClass} mt-2 text-body`}
              />
            ) : (
              <p className="mt-1 flex items-center justify-center gap-2 text-body text-muted-foreground sm:justify-start">
                <Briefcase className="h-4 w-4 shrink-0 opacity-60" />
                {form.headline || "Add your current role"}
              </p>
            )}

            {isEditing ? (
              <Input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className={`${inputClass} mt-2 text-body`}
              />
            ) : (
              <p className="mt-1 flex items-center justify-center gap-1.5 text-body text-muted-foreground sm:justify-start">
                <MapPin className="h-3.5 w-3.5 opacity-70" />
                {form.location || "Add location"}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap justify-center gap-2 border-t border-[var(--border-default)] pt-4 lg:border-t-0 lg:pt-0">
          {isEditing ? (
            <>
              <ProfileButton variant="primary" onClick={() => void saveBasics()} disabled={isSaving}>
                {isSaving ? "Saving…" : "Save"}
              </ProfileButton>
              <ProfileButton variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </ProfileButton>
            </>
          ) : (
            <>
              <ProfileButton variant="primary" icon={<Pencil className="h-4 w-4" />} onClick={() => setIsEditing(true)}>
                Edit profile
              </ProfileButton>
              {profile.resume_url ? (
                <ProfileButton
                  variant="outline"
                  icon={<Download className="h-4 w-4" />}
                  onClick={() => window.open(profile.resume_url!, "_blank")}
                >
                  Resume
                </ProfileButton>
              ) : (
                <ProfileButton variant="outline" icon={<Download className="h-4 w-4" />} disabled>
                  Resume
                </ProfileButton>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-[var(--border-default)] pt-5">
        <p className="text-caption font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          Summary
        </p>
        {isEditing ? (
          <Textarea
            value={form.summary}
            onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
            rows={3}
            placeholder="Professional summary"
            className={`${inputClass} mt-2 text-body`}
          />
        ) : form.summary ? (
          <p className="mt-2 max-w-3xl text-body text-muted-foreground">{form.summary}</p>
        ) : (
          <p className="mt-2 text-body text-muted-foreground">
            Add a concise summary for recruiters and hiring managers.
          </p>
        )}

        {socials.length > 0 ? (
          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            {socials.map(({ href, icon: Icon, label }) => (
              <Link
                key={label}
                href={href!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-default)] bg-[var(--surface-secondary)] px-2.5 py-1.5 text-caption font-semibold text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}
