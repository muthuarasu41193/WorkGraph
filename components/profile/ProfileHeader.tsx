"use client";

import { useMemo, useRef, useState } from "react";
import { Camera, MapPin } from "lucide-react";
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

  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
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
            <div className="flex h-full w-full items-center justify-center bg-[#7C3AED] text-3xl font-bold text-white">
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
          <h1 className="text-2xl font-bold text-[#111827]">{profile.full_name || "Your Name"}</h1>
          <p className="mt-1 text-base text-[#6B7280]">
            {profile.headline || "Add a professional headline"}
          </p>
          <p className="mt-2 inline-flex items-center gap-1 text-sm text-[#9CA3AF]">
            <MapPin className="h-4 w-4" />
            {profile.location || "Location not set"}
          </p>

          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-[#111827]">Profile {completeness}% Complete</p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
              <div className="h-full rounded-full bg-[#7C3AED]" style={{ width: `${completeness}%` }} />
            </div>
            <p className="mt-2 text-xs text-[#9CA3AF]">{getMissingItems(profile)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
