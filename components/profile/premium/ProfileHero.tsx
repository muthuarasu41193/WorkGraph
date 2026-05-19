"use client";

import { motion } from "framer-motion";
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
import Image from "next/image";
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

type Props = {
  profile: Profile;
  userId: string;
  openToWork?: boolean;
};

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
      ? `${profile.years_of_experience}+ yrs experience`
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
    <section className="overflow-hidden rounded-2xl border border-[var(--wg-color-border)] bg-[var(--wg-color-surface)] shadow-[0_8px_40px_-20px_rgba(0,0,0,0.12)]">
      {/* Cover banner */}
      <div className="relative h-32 sm:h-40 md:h-44">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-[#1a73e8]/90 via-[#669df6]/80 to-[#8ab4f8]/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
          animate={{ backgroundPosition: ["0px 0px", "48px 48px"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="relative px-5 pb-6 sm:px-8 sm:pb-8">
        <motion.div
          className="-mt-14 sm:-mt-16"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45 }}
        >
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative h-28 w-28 overflow-hidden rounded-2xl ring-4 ring-[var(--wg-color-surface)] sm:h-32 sm:w-32"
            aria-label="Change profile photo"
          >
            {photoUrl ? (
              <Image src={photoUrl} alt="" fill unoptimized className="object-cover" sizes="128px" />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--wg-color-primary)] to-[#1557b0] text-2xl font-bold text-white">
                {initials}
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
              <Camera className="h-5 w-5 text-white" />
              <span className="sr-only">{isUploading ? "Uploading" : "Upload photo"}</span>
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleUpload(e.target.files?.[0])} />
        </motion.div>

        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <motion.div className="flex flex-wrap items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
              {openToWork ? <ProfileBadge tone="success">Open to work</ProfileBadge> : null}
              <ProfileBadge tone="info">{years}</ProfileBadge>
            </motion.div>

            {isEditing ? (
              <input
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                className="w-full rounded-xl border border-[var(--wg-color-border)] bg-[var(--wg-color-surface-variant)] px-3 py-2 text-2xl font-semibold"
              />
            ) : (
              <h1 className="text-2xl font-bold tracking-tight text-[var(--wg-color-text-primary)] sm:text-3xl">
                {form.full_name || "Your name"}
              </h1>
            )}

            {isEditing ? (
              <input
                value={form.headline}
                onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
                placeholder="Role / title"
                className="w-full rounded-xl border border-[var(--wg-color-border)] px-3 py-2 text-base"
              />
            ) : (
              <p className="flex items-center gap-2 text-base font-medium text-[var(--wg-color-text-secondary)]">
                <Briefcase className="h-4 w-4 shrink-0 text-[var(--wg-color-text-tertiary)]" />
                {form.headline || "Add your current role"}
              </p>
            )}

            {isEditing ? (
              <input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="w-full rounded-xl border border-[var(--wg-color-border)] px-3 py-2 text-sm"
              />
            ) : (
              <p className="flex items-center gap-1.5 text-sm text-[var(--wg-color-text-tertiary)]">
                <MapPin className="h-4 w-4" />
                {form.location || "Add location"}
              </p>
            )}

            {isEditing ? (
              <textarea
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                rows={3}
                placeholder="Professional bio"
                className="w-full rounded-xl border border-[var(--wg-color-border)] px-3 py-2 text-sm leading-relaxed"
              />
            ) : form.summary ? (
              <p className="max-w-2xl text-sm leading-relaxed text-[var(--wg-color-text-secondary)]">{form.summary}</p>
            ) : (
              <p className="text-sm italic text-[var(--wg-color-text-tertiary)]">Add a short professional bio</p>
            )}

            {socials.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {socials.map(({ href, icon: Icon, label }) => (
                  <Link
                    key={label}
                    href={href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--wg-color-border)] text-[var(--wg-color-text-secondary)] transition hover:border-[var(--wg-color-primary)] hover:text-[var(--wg-color-primary)]"
                    aria-label={label}
                  >
                    <Icon className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <motion.div
            className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {isEditing ? (
              <>
                <ProfileButton variant="primary" onClick={() => void saveBasics()} disabled={isSaving}>
                  {isSaving ? "Saving…" : "Save profile"}
                </ProfileButton>
                <ProfileButton variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </ProfileButton>
              </>
            ) : (
              <>
                <ProfileButton variant="outline" icon={<Pencil className="h-4 w-4" />} onClick={() => setIsEditing(true)}>
                  Edit profile
                </ProfileButton>
                {profile.resume_url ? (
                  <ProfileButton
                    variant="secondary"
                    icon={<Download className="h-4 w-4" />}
                    onClick={() => window.open(profile.resume_url!, "_blank")}
                  >
                    Download resume
                  </ProfileButton>
                ) : (
                  <ProfileButton variant="secondary" icon={<Download className="h-4 w-4" />} disabled>
                    No resume yet
                  </ProfileButton>
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
