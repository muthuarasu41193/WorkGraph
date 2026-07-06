"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  PenLine,
  UploadCloud,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { AppShell } from "@/components/layout";
import {
  MAX_RESUME_UPLOAD_BYTES,
  MAX_RESUME_UPLOAD_LABEL,
  apiErrorMessage,
  readApiJson,
  withSupabaseAuthHeaders,
} from "../../lib/api-fetch";
import { describeFetchError } from "../../lib/auth-errors";
import { ensureClientSession } from "../../lib/auth/session-client";
import { supertokensEnabled } from "../../lib/auth/config";
import {
  hardNavigate,
  loginRedirectPath,
  syncClientSession,
  syncServerAuthCookies,
} from "../../lib/client-auth";
import { createBrowserSupabaseClient } from "../../lib/supabase";
import { atsScorePath, parseResumePath } from "../../lib/workgraph-api-routes";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ManualState = {
  email: string;
  full_name: string;
  headline: string;
  summary: string;
  location: string;
  linkedin_url: string;
  github_url: string;
  website_url: string;
  skills: string;
  experience: string;
  education: string;
};

const initialManual: ManualState = {
  email: "",
  full_name: "",
  headline: "",
  summary: "",
  location: "",
  linkedin_url: "",
  github_url: "",
  website_url: "",
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
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        const session = await ensureClientSession();
        if (!session) {
          hardNavigate(loginRedirectPath("/create-profile"));
          return;
        }
        if (session.email) {
          setUploadEmail((prev) => prev || session.email || "");
          setManual((prev) => ({ ...prev, email: prev.email || session.email || "" }));
        }
        setAuthReady(true);
      } catch (err) {
        setError(describeFetchError(err));
        setAuthReady(true);
      }
    }
    void bootstrap();
  }, []);

  async function requireSignedInUser() {
    const session = await ensureClientSession();
    if (!session) {
      hardNavigate(loginRedirectPath("/create-profile"));
      throw new Error("Redirecting to sign in...");
    }
    return session;
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

      const parseRes = await fetch(parseResumePath(), {
        method: "POST",
        headers: await withSupabaseAuthHeaders(),
        body: data,
        credentials: "include",
      });
      const parseJson = await readApiJson(parseRes);
      if (!parseRes.ok) {
        if (parseRes.status === 401) {
          hardNavigate(loginRedirectPath("/create-profile"));
          return;
        }
        throw new Error(apiErrorMessage(parseJson) || "Could not process your resume.");
      }

      const profile =
        parseJson && typeof parseJson === "object" && "profile" in parseJson
          ? (parseJson as { profile?: { email?: string } }).profile
          : undefined;
      const email =
        (typeof profile?.email === "string" && profile.email.trim()) || uploadEmail.trim();

      setLoadingPhase("score");
      const session = await ensureClientSession();
      if (session?.userId) {
        await fetch(atsScorePath(), {
          method: "POST",
          headers: await withSupabaseAuthHeaders({ "Content-Type": "application/json" }),
          credentials: "include",
          body: JSON.stringify({ user_id: session.userId, email }),
        });
      }

      setMessage("Profile saved. Taking you to your profile.");
      if (!supertokensEnabled()) {
        await syncClientSession();
        await syncServerAuthCookies();
      }
      hardNavigate("/profile");
    } catch (err) {
      setError(describeFetchError(err));
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
        summary: manual.summary.trim(),
        location: manual.location.trim(),
        linkedin_url: manual.linkedin_url.trim(),
        github_url: manual.github_url.trim(),
        website_url: manual.website_url.trim(),
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
      if (!saveRes.ok) {
        if (saveRes.status === 401) {
          hardNavigate(loginRedirectPath("/create-profile"));
          return;
        }
        throw new Error(apiErrorMessage(saveJson) || "Could not save your profile.");
      }

      const session = await ensureClientSession();
      if (session?.userId) {
        await fetch(atsScorePath(), {
          method: "POST",
          headers: await withSupabaseAuthHeaders({ "Content-Type": "application/json" }),
          credentials: "include",
          body: JSON.stringify({ user_id: session.userId, email: payload.email }),
        });
      }

      setMessage("Profile saved. Taking you to your profile.");
      if (!supertokensEnabled()) {
        await syncClientSession();
        await syncServerAuthCookies();
      }
      hardNavigate("/profile");
    } catch (err) {
      setError(describeFetchError(err));
    } finally {
      setIsLoading(false);
    }
  }

  if (!authReady) {
    return (
      <AppShell.Auth
        wide
        panelEyebrow="Get started"
        panelHeadline="Build a profile recruiters skim in seconds."
        panelDescription="Checking your session…"
        highlights={["Secure sign-in required", "Resume import", "Manual entry"]}
      >
        <div className="flex items-center justify-center py-16 text-body text-muted-foreground">
          <Spinner className="mr-2" aria-hidden />
          Verifying sign-in…
        </div>
      </AppShell.Auth>
    );
  }

  return (
    <AppShell.Auth
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
            <h2 className="text-heading-l text-foreground">Create your profile</h2>
            <p className="mt-2 max-w-xl text-body text-muted-foreground">
              Signed-in accounts only. Choose import or manual entry — you can edit everything later.
            </p>
          </div>
          <Button asChild variant="link" className="shrink-0 px-0">
            <Link href="/profile">
              View profile
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>

        <Tabs
          value={mode}
          onValueChange={(v) => {
            setMode(v as Mode);
            setError("");
          }}
        >
          <TabsList className="h-11 w-full rounded-full bg-muted/60 p-1 sm:w-auto sm:min-w-[340px]">
            <TabsTrigger value="resume" className="flex-1 gap-2 rounded-full">
              <UploadCloud className="h-4 w-4 shrink-0" aria-hidden />
              Import resume
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex-1 gap-2 rounded-full">
              <PenLine className="h-4 w-4 shrink-0" aria-hidden />
              Manual entry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resume" className="mt-6">
            <Card className="border-border shadow-md">
              <CardContent className="space-y-6 p-6 sm:p-8">
                {message ? (
                  <Alert className="border-success/20 bg-success-subtle text-success-foreground">
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                ) : null}
                {error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}

                <form className="space-y-6" onSubmit={handleUpload}>
                  <div className="space-y-2">
                    <Label htmlFor="profile-email-fallback">
                      Contact email <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <p className="text-caption text-muted-foreground">If your file doesn&apos;t include a readable email.</p>
                    <Input
                      id="profile-email-fallback"
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      value={uploadEmail}
                      onChange={(e) => setUploadEmail(e.target.value)}
                      disabled={isLoading}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Resume file</Label>
                    <p className="text-caption text-muted-foreground">
                      PDF or DOCX · up to {MAX_RESUME_UPLOAD_LABEL} ({formatBytes(MAX_RESUME_UPLOAD_BYTES)})
                    </p>

                    {!file ? (
                      <div
                        {...getRootProps()}
                        className={cn(
                          "group mt-1 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-16 text-center transition-all duration-200",
                          isDragActive
                            ? "scale-[1.01] border-primary bg-primary/5"
                            : "border-border bg-surface-secondary hover:border-primary/40 hover:bg-[var(--interactive-hover)] hover:shadow-md",
                          isLoading && "pointer-events-none opacity-50"
                        )}
                      >
                        <input {...getInputProps()} />
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background shadow-md ring-1 ring-border transition-transform duration-200 group-hover:scale-105">
                          <FileText className="h-6 w-6 text-primary" aria-hidden />
                        </div>
                        <p className="mt-5 text-body font-semibold text-foreground">
                          {isDragActive ? "Drop your file here" : "Drag & drop your resume"}
                        </p>
                        <p className="mt-1 text-body text-muted-foreground">or click to browse — PDF or DOCX</p>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-4">
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-body font-medium text-foreground">{file.name}</p>
                          <p className="text-caption text-muted-foreground">{formatBytes(file.size)}</p>
                        </div>
                        <Button type="button" variant="ghost" size="sm" disabled={isLoading} onClick={() => setFile(null)}>
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>

                  <Button type="submit" disabled={isLoading || !file} className="h-12 w-full rounded-full text-body">
                    {isLoading ? (
                      <>
                        <Spinner aria-hidden />
                        {loadingPhase === "score" ? "Finalizing…" : "Reading resume…"}
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual" className="mt-6">
            <Card className="border-border shadow-md">
              <CardContent className="space-y-5 p-6 sm:p-8">
                {message ? (
                  <Alert className="border-success/20 bg-success-subtle text-success-foreground">
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                ) : null}
                {error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}

                <form className="space-y-5" onSubmit={handleManual}>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="manual-email">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="manual-email"
                        required
                        type="email"
                        autoComplete="email"
                        placeholder="you@company.com"
                        value={manual.email}
                        onChange={(e) => setManual((p) => ({ ...p, email: e.target.value }))}
                        disabled={isLoading}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="manual-name">Full name</Label>
                      <Input
                        id="manual-name"
                        type="text"
                        autoComplete="name"
                        placeholder="Jordan Lee"
                        value={manual.full_name}
                        onChange={(e) => setManual((p) => ({ ...p, full_name: e.target.value }))}
                        disabled={isLoading}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="manual-headline">Professional headline</Label>
                      <Input
                        id="manual-headline"
                        type="text"
                        placeholder="Product engineer · ML infrastructure"
                        value={manual.headline}
                        onChange={(e) => setManual((p) => ({ ...p, headline: e.target.value }))}
                        disabled={isLoading}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manual-location">Location</Label>
                      <Input
                        id="manual-location"
                        type="text"
                        placeholder="Chennai, India"
                        value={manual.location}
                        onChange={(e) => setManual((p) => ({ ...p, location: e.target.value }))}
                        disabled={isLoading}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manual-li">LinkedIn</Label>
                      <Input
                        id="manual-li"
                        type="url"
                        placeholder="https://linkedin.com/in/…"
                        value={manual.linkedin_url}
                        onChange={(e) => setManual((p) => ({ ...p, linkedin_url: e.target.value }))}
                        disabled={isLoading}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manual-gh">GitHub</Label>
                      <Input
                        id="manual-gh"
                        type="url"
                        placeholder="https://github.com/…"
                        value={manual.github_url}
                        onChange={(e) => setManual((p) => ({ ...p, github_url: e.target.value }))}
                        disabled={isLoading}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="manual-website">Website / Portfolio</Label>
                      <Input
                        id="manual-website"
                        type="url"
                        placeholder="https://yourportfolio.com"
                        value={manual.website_url}
                        onChange={(e) => setManual((p) => ({ ...p, website_url: e.target.value }))}
                        disabled={isLoading}
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manual-summary">Professional summary</Label>
                    <Textarea
                      id="manual-summary"
                      rows={3}
                      placeholder="Write a concise summary recruiters can skim quickly."
                      value={manual.summary}
                      onChange={(e) => setManual((p) => ({ ...p, summary: e.target.value }))}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manual-skills">Skills</Label>
                    <p className="text-caption text-muted-foreground">One per line.</p>
                    <Textarea
                      id="manual-skills"
                      rows={4}
                      placeholder={"TypeScript\nDistributed systems\nStakeholder communication"}
                      value={manual.skills}
                      onChange={(e) => setManual((p) => ({ ...p, skills: e.target.value }))}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manual-exp">Experience</Label>
                    <p className="text-caption text-muted-foreground">Bullets or roles, one per line.</p>
                    <Textarea
                      id="manual-exp"
                      rows={4}
                      placeholder="Senior Engineer — Acme (2021–present)…"
                      value={manual.experience}
                      onChange={(e) => setManual((p) => ({ ...p, experience: e.target.value }))}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manual-edu">Education</Label>
                    <p className="text-caption text-muted-foreground">One entry per line.</p>
                    <Textarea
                      id="manual-edu"
                      rows={3}
                      placeholder="M.S. Computer Science — State University"
                      value={manual.education}
                      onChange={(e) => setManual((p) => ({ ...p, education: e.target.value }))}
                      disabled={isLoading}
                    />
                  </div>

                  <Button type="submit" disabled={isLoading} className="h-12 w-full rounded-full text-body">
                    {isLoading ? (
                      <>
                        <Spinner aria-hidden />
                        Saving…
                      </>
                    ) : (
                      <>
                        Save profile
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-center text-caption leading-relaxed text-muted-foreground/70">
          Trouble importing? Confirm you&apos;re signed in, then try manual entry or a different file format.
        </p>

        <p className="text-center text-body text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login?next=/create-profile" className="font-semibold text-primary underline decoration-primary/30 underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </AppShell.Auth>
  );
}
