"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { FileUp, PenSquare } from "lucide-react";

type ManualState = {
  email: string;
  full_name: string;
  headline: string;
  linkedin_url: string;
  github_url: string;
  skills: string;
  experience: string;
  education: string;
};

const initialManual: ManualState = {
  email: "",
  full_name: "",
  headline: "",
  linkedin_url: "",
  github_url: "",
  skills: "",
  experience: "",
  education: "",
};

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);
}

export default function CreateProfilePage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadEmail, setUploadEmail] = useState("");
  const [manual, setManual] = useState<ManualState>(initialManual);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;

    setIsLoading(true);
    setError("");
    setMessage("");
    try {
      const data = new FormData();
      data.append("file", file);
      if (uploadEmail.trim()) data.append("email", uploadEmail.trim());

      const parseRes = await fetch("/api/parse-resume", { method: "POST", body: data });
      const parseJson = await parseRes.json();
      if (!parseRes.ok) throw new Error(parseJson.error || "Failed to parse resume.");

      const email = parseJson?.profile?.email || uploadEmail.trim();
      if (email) {
        await fetch("/api/ats-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
      }

      setMessage("Profile created from resume. Opening profile...");
      window.location.href = email ? `/profile?email=${encodeURIComponent(email)}` : "/profile";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create profile from resume.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        email: manual.email.trim(),
        full_name: manual.full_name.trim(),
        headline: manual.headline.trim(),
        linkedin_url: manual.linkedin_url.trim(),
        github_url: manual.github_url.trim(),
        skills: splitLines(manual.skills),
        experience: splitLines(manual.experience),
        education: splitLines(manual.education),
      };

      const saveRes = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const saveJson = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveJson.error || "Failed to save profile.");

      await fetch("/api/ats-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: payload.email }),
      });

      setMessage("Profile created manually. Opening profile...");
      window.location.href = `/profile?email=${encodeURIComponent(payload.email)}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save manual profile.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] px-6 py-10 text-gray-900">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Create Your Profile</h1>
          <p className="mt-2 text-sm text-gray-600">
            Upload your resume for auto profile creation, or fill details manually.
          </p>
          <p className="mt-3 text-sm">
            <Link href="/profile" className="text-gray-800 underline underline-offset-4">
              View profile page
            </Link>
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FileUp className="h-4 w-4" />
              <h2 className="text-lg font-semibold">Upload Resume</h2>
            </div>
            <form className="space-y-4" onSubmit={handleUpload}>
              <input
                type="email"
                placeholder="Email (required if resume has no email)"
                value={uploadEmail}
                onChange={(e) => setUploadEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <input
                type="file"
                accept=".pdf"
                required
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
              >
                {isLoading ? "Processing..." : "Upload & Create Profile"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <PenSquare className="h-4 w-4" />
              <h2 className="text-lg font-semibold">Enter Details Manually</h2>
            </div>
            <form className="space-y-3" onSubmit={handleManual}>
              {(
                [
                  ["email", "Email"],
                  ["full_name", "Full Name"],
                  ["headline", "Headline"],
                  ["linkedin_url", "LinkedIn URL"],
                  ["github_url", "GitHub URL"],
                ] as const
              ).map(([key, label]) => (
                <input
                  key={key}
                  required={key === "email"}
                  placeholder={label}
                  value={manual[key]}
                  onChange={(e) => setManual((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              ))}
              <textarea
                placeholder="Skills (one per line)"
                value={manual.skills}
                onChange={(e) => setManual((prev) => ({ ...prev, skills: e.target.value }))}
                className="min-h-20 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Experience (one per line)"
                value={manual.experience}
                onChange={(e) => setManual((prev) => ({ ...prev, experience: e.target.value }))}
                className="min-h-20 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Education (one per line)"
                value={manual.education}
                onChange={(e) => setManual((prev) => ({ ...prev, education: e.target.value }))}
                className="min-h-20 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
              >
                {isLoading ? "Saving..." : "Save Manual Profile"}
              </button>
            </form>
          </section>
        </div>

        {message ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
