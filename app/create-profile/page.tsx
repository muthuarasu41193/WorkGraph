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

const MAX_BYTES = 5 * 1024 * 1024;

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);
}

async function readJsonSafely(response: Response) {
  const raw = await response.text();
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    const looksLikeHosted404 =
      response.status === 404 ||
      /\bNOT_FOUND\b/i.test(raw) ||
      /the page could not be found/i.test(raw);
    if (looksLikeHosted404) {
      throw new Error(
        "The resume API was not found. Use profile setup from this same site while the Next.js app is running (e.g. open /create-profile on your deployment or localhost:3000), not a standalone HTML preview server."
      );
    }
    const short = raw.slice(0, 140).replace(/\s+/g, " ").trim();
    throw new Error(
      short
        ? `Server returned non-JSON response: ${short}`
        : "Server returned a non-JSON response."
    );
  }
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
    setError("Use a PDF or Word document (.docx) under 5 MB.");
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: acceptedTypes,
    maxFiles: 1,
    maxSize: MAX_BYTES,
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
      const data = new FormData();
      data.append("file", file);
      if (uploadEmail.trim()) data.append("email", uploadEmail.trim());

      const parseRes = await fetch("/api/parse-resume", {
        method: "POST",
        body: data,
        credentials: "include",
      });
      const parseJson = await readJsonSafely(parseRes);
      if (!parseRes.ok) throw new Error(parseJson.error || "Could not process your resume.");

      const email =
        (typeof parseJson?.profile?.email === "string" && parseJson.profile.email.trim()) ||
        uploadEmail.trim();

      setLoadingPhase("score");
      if (email) {
        await fetch("/api/ats-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const saveJson = await readJsonSafely(saveRes);
      if (!saveRes.ok) throw new Error(saveJson.error || "Could not save your profile.");

      await fetch("/api/ats-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    <main className="relative min-h-screen overflow-hidden bg-[#f8f9fb] text-slate-900 antialiased">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 0%, rgb(226 232 240 / 0.9), transparent 42%), radial-gradient(circle at 80% 10%, rgb(241 245 249 / 0.95), transparent 38%)",
        }}
      />

      <div className="relative mx-auto max-w-xl px-5 pb-20 pt-14 sm:px-6 sm:pt-20">
        <header className="mb-10 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Profile setup
          </p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">
            Create your profile
          </h1>
          <p className="mx-auto mt-3 max-w-md text-pretty text-[15px] leading-relaxed text-slate-600">
            Import details from a resume, or enter them yourself. You can refine everything later on
            your profile page.
          </p>
          <Link
            href="/profile"
            className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-900 hover:decoration-slate-400"
          >
            View existing profile
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </header>

        <div
          className="mb-8 flex rounded-xl border border-slate-200/80 bg-white/70 p-1 shadow-sm backdrop-blur-sm"
          role="tablist"
          aria-label="Profile creation method"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "resume"}
            className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              mode === "resume"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
            onClick={() => {
              setMode("resume");
              setError("");
            }}
          >
            <UploadCloud className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            Resume import
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "manual"}
            className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              mode === "manual"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
          className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_1px_3px_rgb(15_23_42/0.06)] sm:p-8"
          aria-live="polite"
        >
          {mode === "resume" ? (
            <form className="space-y-6" onSubmit={handleUpload}>
              <div>
                <label htmlFor="profile-email-fallback" className="block text-sm font-medium text-slate-800">
                  Contact email
                  <span className="ml-1 font-normal text-slate-500">(optional)</span>
                </label>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Used only if your file does not include an email we can read.
                </p>
                <input
                  id="profile-email-fallback"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={uploadEmail}
                  onChange={(e) => setUploadEmail(e.target.value)}
                  disabled={isLoading}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 outline-none ring-slate-900/5 transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-4 disabled:opacity-60"
                />
              </div>

              <div>
                <span className="block text-sm font-medium text-slate-800">Resume file</span>
                <p className="mt-1 text-xs text-slate-500">PDF or DOCX · maximum {formatBytes(MAX_BYTES)}</p>

                {!file ? (
                  <div
                    {...getRootProps()}
                    className={`mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-12 text-center transition-colors duration-200 ${
                      isDragActive
                        ? "border-slate-400 bg-slate-50"
                        : "border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-slate-50"
                    } ${isLoading ? "pointer-events-none opacity-50" : ""}`}
                  >
                    <input {...getInputProps()} />
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200/80">
                      <FileText className="h-5 w-5 text-slate-500" aria-hidden />
                    </div>
                    <p className="mt-4 text-sm font-medium text-slate-800">
                      {isDragActive ? "Drop file here" : "Drag and drop your resume"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">or click to browse from your device</p>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
                      <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => setFile(null)}
                      className="shrink-0 text-xs font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !file}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {loadingPhase === "score" ? "Finalizing profile…" : "Reading resume…"}
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
            <form className="space-y-4" onSubmit={handleManual}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="manual-email" className="block text-sm font-medium text-slate-800">
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
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-900/5 disabled:opacity-60"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="manual-name" className="block text-sm font-medium text-slate-800">
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
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-900/5 disabled:opacity-60"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="manual-headline" className="block text-sm font-medium text-slate-800">
                    Professional headline
                  </label>
                  <input
                    id="manual-headline"
                    type="text"
                    placeholder="Product engineer · ML infrastructure"
                    value={manual.headline}
                    onChange={(e) => setManual((p) => ({ ...p, headline: e.target.value }))}
                    disabled={isLoading}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-900/5 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label htmlFor="manual-li" className="block text-sm font-medium text-slate-800">
                    LinkedIn
                  </label>
                  <input
                    id="manual-li"
                    type="url"
                    placeholder="https://linkedin.com/in/…"
                    value={manual.linkedin_url}
                    onChange={(e) => setManual((p) => ({ ...p, linkedin_url: e.target.value }))}
                    disabled={isLoading}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-900/5 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label htmlFor="manual-gh" className="block text-sm font-medium text-slate-800">
                    GitHub
                  </label>
                  <input
                    id="manual-gh"
                    type="url"
                    placeholder="https://github.com/…"
                    value={manual.github_url}
                    onChange={(e) => setManual((p) => ({ ...p, github_url: e.target.value }))}
                    disabled={isLoading}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-900/5 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="manual-skills" className="block text-sm font-medium text-slate-800">
                  Skills
                </label>
                <p className="mt-1 text-xs text-slate-500">One skill per line.</p>
                <textarea
                  id="manual-skills"
                  rows={4}
                  placeholder={"TypeScript\nDistributed systems\nStakeholder communication"}
                  value={manual.skills}
                  onChange={(e) => setManual((p) => ({ ...p, skills: e.target.value }))}
                  disabled={isLoading}
                  className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-900/5 disabled:opacity-60"
                />
              </div>

              <div>
                <label htmlFor="manual-exp" className="block text-sm font-medium text-slate-800">
                  Experience
                </label>
                <p className="mt-1 text-xs text-slate-500">Short bullets or roles, one per line.</p>
                <textarea
                  id="manual-exp"
                  rows={4}
                  placeholder="Senior Engineer — Acme (2021–present)…"
                  value={manual.experience}
                  onChange={(e) => setManual((p) => ({ ...p, experience: e.target.value }))}
                  disabled={isLoading}
                  className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-900/5 disabled:opacity-60"
                />
              </div>

              <div>
                <label htmlFor="manual-edu" className="block text-sm font-medium text-slate-800">
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
                  className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-900/5 disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
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

        {message ? (
          <p className="mt-6 rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-center text-sm text-emerald-900">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mt-6 rounded-xl border border-red-200/90 bg-red-50 px-4 py-3 text-center text-sm text-red-900">
            {error}
          </p>
        ) : null}

        <p className="mt-10 text-center text-xs leading-relaxed text-slate-500">
          Signed-in accounts only. If import fails, check that you are logged in and try manual entry.
        </p>
      </div>
    </main>
  );
}
