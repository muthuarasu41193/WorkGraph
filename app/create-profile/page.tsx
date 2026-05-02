"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  PenLine,
  UploadCloud,
} from "lucide-react";
import { AuthSplitShell } from "../../components/auth/AuthSplitShell";
import {
  MAX_RESUME_UPLOAD_BYTES,
  MAX_RESUME_UPLOAD_LABEL,
  apiErrorMessage,
  readApiJson,
  withSupabaseAuthHeaders,
} from "../../lib/api-fetch";
import { createBrowserSupabaseClient } from "../../lib/supabase";

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

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

type Mode = "resume" | "manual";

export default function CreateProfilePage() {
  const [mode, setMode] = useState<Mode>("resume");
  const [file, setFile] = useState<File | null>(null);
  const [uploadEmail, setUploadEmail] = useState("");
  const [manual, setManual] = useState<ManualState>(initialManual);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<"parse" | "score" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function requireSignedInUser() {
    const supabase = createBrowserSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      window.location.href = "/login?next=/create-profile";
      throw new Error("Redirecting to sign in...");
    }
  }

  const acceptedTypes = useMemo(
    () => ({
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    }),
    []
  );

  const onDrop = useCallback((files: File[]) => {
    const next = files[0];
    if (!next) return;
    setFile(next);
    setError("");
  }, []);

  const onDropRejected = useCallback(() => {
    setFile(null);
    setError(`Use a PDF or Word document (.docx) under ${MAX_RESUME_UPLOAD_LABEL}.`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: acceptedTypes,
    maxFiles: 1,
    maxSize: MAX_RESUME_UPLOAD_BYTES,
    disabled: isLoading,
  });

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;

    setIsLoading(true);
    setLoadingPhase("parse");
    setError("");
    setMessage("");
    try {
      await requireSignedInUser();
      const data = new FormData();
      data.append("file", file);
      if (uploadEmail.trim()) data.append("email", uploadEmail.trim());

      const parseRes = await fetch("/api/parse-resume", {
        method: "POST",
        headers: await withSupabaseAuthHeaders(),
        body: data,
        credentials: "include",
      });
      const parseJson = await readApiJson(parseRes);
      if (!parseRes.ok) {
        throw new Error(apiErrorMessage(parseJson) || "Could not process your resume.");
      }

      const profile =
        parseJson && typeof parseJson === "object" && "profile" in parseJson
          ? (parseJson as { profile?: { email?: string } }).profile
          : undefined;
      const email =
        (typeof profile?.email === "string" && profile.email.trim()) || uploadEmail.trim();

      setLoadingPhase("score");
      if (email) {
        await fetch("/api/ats-score", {
          method: "POST",
          headers: await withSupabaseAuthHeaders({ "Content-Type": "application/json" }),
          credentials: "include",
          body: JSON.stringify({ email }),
        });
      }

      setMessage("Profile saved. Taking you to your profile.");
      window.location.href = email ? `/profile?email=${encodeURIComponent(email)}` : "/profile";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while importing your resume.");
    } finally {
      setIsLoading(false);
      setLoadingPhase(null);
    }
  }

  async function handleManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");
    try {
      await requireSignedInUser();
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
        headers: await withSupabaseAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const saveJson = await readApiJson(saveRes);
      if (!saveRes.ok) throw new Error(apiErrorMessage(saveJson) || "Could not save your profile.");

      await fetch("/api/ats-score", {
        method: "POST",
        headers: await withSupabaseAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({ email: payload.email }),
      });

      setMessage("Profile saved. Taking you to your profile.");
      window.location.href = `/profile?email=${encodeURIComponent(payload.email)}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save your profile.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthSplitShell
      wide
      panelEyebrow="Get started"
      panelHeadline="Build a profile recruiters skim in seconds."
      panelDescription="Upload once or type it in — refine headlines, links, and bullets anytime."
      highlights={[
        "Smart resume import (PDF & DOCX)",
        "Structured sections hiring teams expect",
        "ATS-aware polish after you save",
      ]}
    >
      <div className="wg-auth-enter space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Create your profile</h2>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-slate-600">
              Signed-in accounts only. Choose import or manual entry — you can edit everything later.
            </p>
          </div>
          <Link
            href="/profile"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-emerald-900 underline decoration-emerald-200 underline-offset-[5px] hover:text-emerald-950 hover:decoration-emerald-700"
          >
            View profile
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div
          className="inline-flex h-11 w-full rounded-full bg-emerald-50/70 p-1 ring-1 ring-emerald-100/90 sm:w-auto sm:min-w-[340px]"
          role="tablist"
          aria-label="Profile creation method"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "resume"}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-all duration-200 ${
              mode === "resume"
                ? "bg-white text-emerald-950 shadow-sm ring-1 ring-emerald-200/80"
                : "text-emerald-900/65 hover:text-emerald-950"
            }`}
            onClick={() => {
              setMode("resume");
              setError("");
            }}
          >
            <UploadCloud className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            Import resume
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "manual"}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-all duration-200 ${
              mode === "manual"
                ? "bg-white text-emerald-950 shadow-sm ring-1 ring-emerald-200/80"
                : "text-emerald-900/65 hover:text-emerald-950"
            }`}
            onClick={() => {
              setMode("manual");
              setError("");
            }}
          >
            <PenLine className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            Manual entry
          </button>
        </div>

        <section
          className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_24px_80px_-24px_rgb(15_23_42/0.12)] sm:p-8"
          aria-live="polite"
        >
          {message ? (
            <p className="mb-6 rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{message}</p>
          ) : null}
          {error ? (
            <p className="mb-6 rounded-xl border border-red-200/90 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</p>
          ) : null}

          {mode === "resume" ? (
            <form className="space-y-6" onSubmit={handleUpload}>
              <div>
                <label htmlFor="profile-email-fallback" className="block text-sm font-semibold text-slate-900">
                  Contact email <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <p className="mt-1 text-xs text-slate-500">If your file doesn&apos;t include a readable email.</p>
                <input
                  id="profile-email-fallback"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={uploadEmail}
                  onChange={(e) => setUploadEmail(e.target.value)}
                  disabled={isLoading}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-800 focus:bg-white focus:ring-4 focus:ring-emerald-900/12 disabled:opacity-60"
                />
              </div>

              <div>
                <span className="block text-sm font-semibold text-slate-900">Resume file</span>
                <p className="mt-1 text-xs text-slate-500">
                  PDF or DOCX · up to {MAX_RESUME_UPLOAD_LABEL} ({formatBytes(MAX_RESUME_UPLOAD_BYTES)})
                </p>

                {!file ? (
                  <div
                    {...getRootProps()}
                    className={`group mt-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-14 text-center transition-all duration-200 ${
                      isDragActive
                        ? "scale-[1.01] border-emerald-500 bg-emerald-50/70"
                        : "border-slate-200 bg-gradient-to-b from-emerald-50/35 via-white to-white hover:border-emerald-200 hover:shadow-[0_12px_40px_-28px_rgb(16_185_129/0.14)]"
                    } ${isLoading ? "pointer-events-none opacity-50" : ""}`}
                  >
                    <input {...getInputProps()} />
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-slate-200/80 transition-transform duration-200 group-hover:scale-105">
                      <FileText className="h-6 w-6 text-emerald-600" aria-hidden />
                    </div>
                    <p className="mt-5 text-[15px] font-semibold text-slate-900">
                      {isDragActive ? "Drop your file here" : "Drag & drop your resume"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">or click to browse — PDF or DOCX</p>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
                      <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => setFile(null)}
                      className="shrink-0 text-xs font-semibold text-slate-700 underline-offset-2 hover:underline disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !file}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-900 text-[15px] font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.08)_inset] transition hover:bg-emerald-950 disabled:cursor-not-allowed disabled:bg-emerald-100 disabled:text-emerald-400"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {loadingPhase === "score" ? "Finalizing…" : "Reading resume…"}
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleManual}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="manual-email" className="block text-sm font-semibold text-slate-900">
                    Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="manual-email"
                    required
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={manual.email}
                    onChange={(e) => setManual((p) => ({ ...p, email: e.target.value }))}
                    disabled={isLoading}
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 text-[15px] outline-none transition focus:border-emerald-800 focus:bg-white focus:ring-4 focus:ring-emerald-900/12 disabled:opacity-60"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="manual-name" className="block text-sm font-semibold text-slate-900">
                    Full name
                  </label>
                  <input
                    id="manual-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Jordan Lee"
                    value={manual.full_name}
                    onChange={(e) => setManual((p) => ({ ...p, full_name: e.target.value }))}
                    disabled={isLoading}
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 text-[15px] outline-none transition focus:border-emerald-800 focus:bg-white focus:ring-4 focus:ring-emerald-900/12 disabled:opacity-60"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="manual-headline" className="block text-sm font-semibold text-slate-900">
                    Professional headline
                  </label>
                  <input
                    id="manual-headline"
                    type="text"
                    placeholder="Product engineer · ML infrastructure"
                    value={manual.headline}
                    onChange={(e) => setManual((p) => ({ ...p, headline: e.target.value }))}
                    disabled={isLoading}
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 text-[15px] outline-none transition focus:border-emerald-800 focus:bg-white focus:ring-4 focus:ring-emerald-900/12 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label htmlFor="manual-li" className="block text-sm font-semibold text-slate-900">
                    LinkedIn
                  </label>
                  <input
                    id="manual-li"
                    type="url"
                    placeholder="https://linkedin.com/in/…"
                    value={manual.linkedin_url}
                    onChange={(e) => setManual((p) => ({ ...p, linkedin_url: e.target.value }))}
                    disabled={isLoading}
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 text-[15px] outline-none transition focus:border-emerald-800 focus:bg-white focus:ring-4 focus:ring-emerald-900/12 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label htmlFor="manual-gh" className="block text-sm font-semibold text-slate-900">
                    GitHub
                  </label>
                  <input
                    id="manual-gh"
                    type="url"
                    placeholder="https://github.com/…"
                    value={manual.github_url}
                    onChange={(e) => setManual((p) => ({ ...p, github_url: e.target.value }))}
                    disabled={isLoading}
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 text-[15px] outline-none transition focus:border-emerald-800 focus:bg-white focus:ring-4 focus:ring-emerald-900/12 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="manual-skills" className="block text-sm font-semibold text-slate-900">
                  Skills
                </label>
                <p className="mt-1 text-xs text-slate-500">One per line.</p>
                <textarea
                  id="manual-skills"
                  rows={4}
                  placeholder={"TypeScript\nDistributed systems\nStakeholder communication"}
                  value={manual.skills}
                  onChange={(e) => setManual((p) => ({ ...p, skills: e.target.value }))}
                  disabled={isLoading}
                  className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-[15px] outline-none transition focus:border-emerald-800 focus:bg-white focus:ring-4 focus:ring-emerald-900/12 disabled:opacity-60"
                />
              </div>

              <div>
                <label htmlFor="manual-exp" className="block text-sm font-semibold text-slate-900">
                  Experience
                </label>
                <p className="mt-1 text-xs text-slate-500">Bullets or roles, one per line.</p>
                <textarea
                  id="manual-exp"
                  rows={4}
                  placeholder="Senior Engineer — Acme (2021–present)…"
                  value={manual.experience}
                  onChange={(e) => setManual((p) => ({ ...p, experience: e.target.value }))}
                  disabled={isLoading}
                  className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-[15px] outline-none transition focus:border-emerald-800 focus:bg-white focus:ring-4 focus:ring-emerald-900/12 disabled:opacity-60"
                />
              </div>

              <div>
                <label htmlFor="manual-edu" className="block text-sm font-semibold text-slate-900">
                  Education
                </label>
                <p className="mt-1 text-xs text-slate-500">One entry per line.</p>
                <textarea
                  id="manual-edu"
                  rows={3}
                  placeholder="M.S. Computer Science — State University"
                  value={manual.education}
                  onChange={(e) => setManual((p) => ({ ...p, education: e.target.value }))}
                  disabled={isLoading}
                  className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-[15px] outline-none transition focus:border-emerald-800 focus:bg-white focus:ring-4 focus:ring-emerald-900/12 disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-900 text-[15px] font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.08)_inset] transition hover:bg-emerald-950 disabled:cursor-not-allowed disabled:bg-emerald-100 disabled:text-emerald-400"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  <>
                    Save profile
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </>
                )}
              </button>
            </form>
          )}
        </section>

        <p className="text-center text-xs leading-relaxed text-slate-400">
          Trouble importing? Confirm you&apos;re signed in, then try manual entry or a different file format.
        </p>

        <p className="text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            href="/login?next=/create-profile"
            className="font-semibold text-emerald-900 underline decoration-emerald-200 underline-offset-[5px] hover:text-emerald-950 hover:decoration-emerald-700"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthSplitShell>
  );
}
