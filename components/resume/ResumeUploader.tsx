"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  AlertCircle,
  Check,
  CheckCircle,
  FileText,
  Upload,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "../../lib/supabase";
import {
  MAX_RESUME_UPLOAD_BYTES,
  MAX_RESUME_UPLOAD_LABEL,
  apiErrorMessage,
  readApiJson,
  withSupabaseAuthHeaders,
} from "../../lib/api-fetch";

type UploadStatus = "default" | "selected" | "uploading" | "parsing" | "success" | "error";

const MAX_FILE_SIZE = MAX_RESUME_UPLOAD_BYTES;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

export default function ResumeUploader() {
  const router = useRouter();
  const [status, setStatus] = useState<UploadStatus>("default");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [progress, setProgress] = useState(0);

  const acceptedTypes = useMemo(
    () => ({
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    }),
    []
  );

  useEffect(() => {
    if (status !== "uploading") return;
    const timer = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + 8 : prev));
    }, 180);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status !== "success") return;
    const timer = setTimeout(() => {
      router.push("/profile");
      router.refresh();
    }, 2000);
    return () => clearTimeout(timer);
  }, [status, router]);

  const reset = useCallback(() => {
    setSelectedFile(null);
    setStatus("default");
    setProgress(0);
    setErrorMessage("");
  }, []);

  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setSelectedFile(file);
    setStatus("selected");
    setErrorMessage("");
    setProgress(0);
  }, []);

  const onDropRejected = useCallback(() => {
    setSelectedFile(null);
    setStatus("error");
    setErrorMessage(`Only PDF/DOCX files up to ${MAX_RESUME_UPLOAD_LABEL} are allowed.`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: acceptedTypes,
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
  });

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setStatus("uploading");
    setProgress(10);
    setErrorMessage("");

    try {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Please sign in before uploading your resume.");
      }

      const timestamp = Date.now();
      const safeName = selectedFile.name.replace(/\s+/g, "-");
      const storagePath = `${user.id}/${timestamp}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(storagePath, selectedFile, { upsert: false });

      if (uploadError) throw new Error(uploadError.message);

      setProgress(100);

      const { data: publicData } = supabase.storage.from("resumes").getPublicUrl(storagePath);

      setStatus("parsing");
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (user.email) formData.append("email", user.email);
      if (publicData.publicUrl) formData.append("resume_url", publicData.publicUrl);

      const parseRes = await fetch(
        process.env.NEXT_PUBLIC_WORKGRAPH_API_URL ? "/api/v2/parse-resume" : "/api/parse-resume",
        {
        method: "POST",
        headers: await withSupabaseAuthHeaders(),
        body: formData,
        credentials: "include",
        },
      );
      const parseJson = await readApiJson(parseRes);
      if (!parseRes.ok) {
        throw new Error(apiErrorMessage(parseJson) || "Failed to parse resume.");
      }

      const parsed = parseJson as { profile?: { email?: string | null } };
      const profileEmail = parsed?.profile?.email || user.email;
      if (profileEmail) {
        await fetch(
          process.env.NEXT_PUBLIC_WORKGRAPH_API_URL ? "/api/v2/ats-score" : "/api/ats-score",
          {
            method: "POST",
            headers: await withSupabaseAuthHeaders({ "Content-Type": "application/json" }),
            credentials: "include",
            body: JSON.stringify({ user_id: user.id, email: profileEmail }),
          },
        );
      }

      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  }, [selectedFile]);

  if (status === "uploading") {
    return (
      <div className="rounded-[14px] border border-border bg-card p-8 shadow-sm">
        <p className="mb-3 text-body font-medium text-foreground">Uploading your resume...</p>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  if (status === "parsing") {
    return (
      <div className="rounded-[14px] border border-border bg-card p-8 text-center shadow-sm">
        <Spinner size="xl" className="mx-auto text-primary" />
        <p className="mt-4 text-body-lg font-semibold text-foreground">Analyzing your resume…</p>
        <p className="mt-1 text-body text-muted-foreground">Usually finishes in a few seconds</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <CheckCircle className="mx-auto h-10 w-10 text-success" />
        <p className="mt-4 text-body-lg font-semibold text-foreground">Resume parsed successfully!</p>
        <p className="mt-1 text-body text-muted-foreground">Redirecting to your profile...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-2xl border border-danger/20 bg-surface-primary p-8 text-center shadow-sm">
        <AlertCircle className="mx-auto h-10 w-10 text-rose-600" />
        <p className="mt-4 text-body-lg font-semibold text-foreground">Upload failed</p>
        <p className="mt-1 text-body text-muted-foreground">{errorMessage}</p>
        <Button type="button" variant="secondary" onClick={reset} className="mt-5">
          Try Again
        </Button>
      </div>
    );
  }

  if (status === "selected" && selectedFile) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-body font-medium text-foreground">{selectedFile.name}</p>
            <p className="text-caption text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
          </div>
          <Check className="h-5 w-5 text-success" />
        </div>

        <Button type="button" onClick={handleUpload} className="mt-6 w-full">
          Upload Resume
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition ${
          isDragActive ? "border-primary bg-primary/5" : "border-border"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-4 text-body-lg font-semibold text-foreground">Drag and drop your resume here</p>
        <p className="mt-1 text-body text-muted-foreground">or click to browse</p>
      </div>
      <p className="mt-4 text-center text-caption text-muted-foreground">
        Supports PDF and DOCX · Max {MAX_RESUME_UPLOAD_LABEL}
      </p>
    </div>
  );
}
