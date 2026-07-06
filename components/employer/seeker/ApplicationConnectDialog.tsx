"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  ExternalLink,
  FileText,
  GitBranch,
  Globe,
  Link2,
  Loader2,
  Upload,
} from "lucide-react";
import type { HiringSignal } from "@/lib/employer/types";
import {
  MAX_RESUME_UPLOAD_BYTES,
  MAX_RESUME_UPLOAD_LABEL,
} from "@/lib/api-fetch";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type ApplicationFormValues = {
  message: string;
  resumeUrl: string;
  linkedinUrl: string;
  githubUrl: string;
  websiteUrl: string;
  stackoverflowUrl: string;
};

type Props = {
  signal: HiringSignal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues: ApplicationFormValues;
  onSubmit: (values: ApplicationFormValues) => Promise<void>;
  submitting: boolean;
  error: string;
};

function StackOverflowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.986 21.865v-6.404h2.134V24H1.844v-8.539h2.13v6.404h15.012zM6.111 15.573l11.39-2.462 0.455 2.11-11.39 2.462-0.455-2.11zm1.359-5.362L18.76 6.32l0.911 1.984L8.381 12.195l-0.911-1.984zm2.683-4.918l10.044 4.605 0.911-1.984L10.064 3.31l-0.911 1.983z" />
    </svg>
  );
}

export default function ApplicationConnectDialog({
  signal,
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  submitting,
  error,
}: Props) {
  const [values, setValues] = useState<ApplicationFormValues>(initialValues);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");

  useEffect(() => {
    if (open) {
      setValues(initialValues);
      setResumeError("");
      setResumeFileName(initialValues.resumeUrl ? "Resume on file" : "");
    }
  }, [open, initialValues]);

  const uploadResume = useCallback(async (file: File) => {
    setResumeUploading(true);
    setResumeError("");
    try {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Please sign in to upload your resume.");

      const storagePath = `${user.id}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(storagePath, file, { upsert: false });
      if (uploadError) throw new Error(uploadError.message);

      const { data: publicData } = supabase.storage.from("resumes").getPublicUrl(storagePath);
      if (!publicData.publicUrl) throw new Error("Could not get resume URL.");

      await supabase
        .from("profiles")
        .update({ resume_url: publicData.publicUrl, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      setValues((prev) => ({ ...prev, resumeUrl: publicData.publicUrl }));
      setResumeFileName(file.name);
    } catch (err) {
      setResumeError(err instanceof Error ? err.message : "Resume upload failed");
    } finally {
      setResumeUploading(false);
    }
  }, []);

  const onDrop = useCallback(
    (files: File[]) => {
      const file = files[0];
      if (file) void uploadResume(file);
    },
    [uploadResume],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: () => setResumeError(`Only PDF/DOCX up to ${MAX_RESUME_UPLOAD_LABEL}.`),
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    maxSize: MAX_RESUME_UPLOAD_BYTES,
    disabled: resumeUploading,
  });

  async function handleSubmit() {
    await onSubmit(values);
  }

  const linkFields: Array<{
    key: keyof Pick<
      ApplicationFormValues,
      "linkedinUrl" | "githubUrl" | "websiteUrl" | "stackoverflowUrl"
    >;
    label: string;
    placeholder: string;
    icon: React.ReactNode;
  }> = [
    {
      key: "linkedinUrl",
      label: "LinkedIn",
      placeholder: "https://linkedin.com/in/yourname",
      icon: <Link2 className="h-4 w-4 text-muted-foreground" />,
    },
    {
      key: "githubUrl",
      label: "GitHub",
      placeholder: "https://github.com/yourname",
      icon: <GitBranch className="h-4 w-4 text-muted-foreground" />,
    },
    {
      key: "websiteUrl",
      label: "Personal website",
      placeholder: "https://yourwebsite.com",
      icon: <Globe className="h-4 w-4 text-muted-foreground" />,
    },
    {
      key: "stackoverflowUrl",
      label: "Stack Overflow",
      placeholder: "https://stackoverflow.com/users/…",
      icon: <StackOverflowIcon className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply to {signal?.title}</DialogTitle>
        </DialogHeader>
        <p className="text-body text-muted-foreground">
          Share your resume, profile links, and a message highlighting skills relevant to this role.
          Your phone number stays private.
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Resume</Label>
            {values.resumeUrl ? (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-body">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{resumeFileName || "Resume attached"}</span>
                <a
                  href={values.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-[var(--accent)] hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ) : null}
            <div
              {...getRootProps()}
              className={`cursor-pointer rounded-lg border-2 border-dashed px-4 py-5 text-center text-body transition ${
                isDragActive ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-muted"
              } ${resumeUploading ? "pointer-events-none opacity-60" : ""}`}
            >
              <input {...getInputProps()} />
              {resumeUploading ? (
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <Upload className="mx-auto h-5 w-5 text-muted-foreground" />
              )}
              <p className="mt-2 font-medium">
                {values.resumeUrl ? "Replace resume" : "Upload resume (required)"}
              </p>
              <p className="mt-1 text-caption text-muted-foreground">
                PDF or DOCX · max {MAX_RESUME_UPLOAD_LABEL}
              </p>
            </div>
            {resumeError ? <p className="text-caption text-destructive">{resumeError}</p> : null}
          </div>

          <div className="space-y-3">
            <Label>Profile links</Label>
            {linkFields.map((field) => (
              <div key={field.key} className="flex items-center gap-2">
                <div className="shrink-0">{field.icon}</div>
                <Input
                  value={values[field.key]}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="text-body"
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="application-message">Message to hiring team</Label>
            <Textarea
              id="application-message"
              value={values.message}
              onChange={(e) => setValues((prev) => ({ ...prev, message: e.target.value }))}
              rows={5}
              placeholder="Highlight your relevant skills, experience, and why you're a strong fit for this role…"
              maxLength={2000}
            />
            <p className="text-right text-caption text-muted-foreground">{values.message.length}/2000</p>
          </div>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting || resumeUploading || !values.resumeUrl}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
