"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  onProfileSaved,
  onProfileSaveError,
  onProfileSaveStart,
  onSaveAllBegin,
} from "../../lib/profile-save-events";

function formatSavedTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function sectionLabel(section: string): string {
  const map: Record<string, string> = {
    header: "Header",
    links: "Links",
    skills: "Skills",
    experience: "Experience",
    education: "Education",
  };
  return map[section] || section;
}

export default function ProfileSaveStatus() {
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [section, setSection] = useState("profile");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [saveAllPending, setSaveAllPending] = useState<string[]>([]);
  const [saveAllFailed, setSaveAllFailed] = useState<string[]>([]);
  const [saveAllCompleted, setSaveAllCompleted] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const finalizeSaveAll = () => {
      if (!saveAllPending.length || !saveAllCompleted) return;
      if (saveAllFailed.length === 0) {
        setSection("all sections");
        setSavedAt(new Date());
        setState("saved");
      } else {
        setSection("all sections");
        setErrorMessage(`Failed: ${saveAllFailed.map(sectionLabel).join(", ")}`);
        setState("error");
      }
      setSaveAllCompleted(false);
    };
    finalizeSaveAll();
  }, [saveAllPending, saveAllFailed, saveAllCompleted]);

  useEffect(() => {
    const offSaveAllBegin = onSaveAllBegin((sections) => {
      setSaveAllPending(sections);
      setSaveAllFailed([]);
      setSaveAllCompleted(true);
      setSection("all sections");
      setState("saving");
      setErrorMessage("");
      setVisible(true);
    });

    const offSaved = onProfileSaved((savedSection) => {
      if (saveAllCompleted) {
        setSaveAllPending((prev) => prev.filter((item) => item !== savedSection));
        return;
      }
      setSavedAt(new Date());
      setSection(savedSection);
      setState("saved");
      setVisible(true);
    });
    const offStart = onProfileSaveStart((savingSection) => {
      setSection(savingSection);
      setState("saving");
      setErrorMessage("");
      setVisible(true);
    });
    const offError = onProfileSaveError((errorSection, message) => {
      if (saveAllCompleted) {
        setSaveAllPending((prev) => prev.filter((item) => item !== errorSection));
        setSaveAllFailed((prev) => (prev.includes(errorSection) ? prev : [...prev, errorSection]));
        return;
      }
      setSection(errorSection);
      setErrorMessage(message);
      setState("error");
      setVisible(true);
    });
    return () => {
      offSaveAllBegin();
      offSaved();
      offStart();
      offError();
    };
  }, [saveAllCompleted]);

  useEffect(() => {
    if (!visible || state === "saving") return;
    const timeout = window.setTimeout(() => setVisible(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [visible, state, savedAt, errorMessage]);

  const text = useMemo(() => {
    if (state === "saving") {
      if (saveAllCompleted) {
        const total = saveAllPending.length + saveAllFailed.length;
        const done = total - saveAllPending.length;
        return `Saving all sections... (${done}/${Math.max(total, 1)})`;
      }
      return `Saving ${section}...`;
    }
    if (state === "error") return `Could not save ${section}: ${errorMessage}`;
    if (!savedAt) return "Changes will autosave as you edit.";
    return `Saved ${section} at ${formatSavedTime(savedAt)}`;
  }, [savedAt, section, state, errorMessage, saveAllCompleted, saveAllPending.length, saveAllFailed.length]);

  const icon =
    state === "saving" ? (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      </span>
    ) : state === "error" ? (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
        <AlertCircle className="size-3.5" strokeWidth={2.25} aria-hidden />
      </span>
    ) : (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
        <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
      </span>
    );

  if (!visible) return null;

  return (
    <div
      role="status"
      className={cn(
        "wg-toast fixed bottom-5 right-5 z-40 flex items-center gap-3 border border-slate-200 bg-white p-3.5 shadow-lg dark:border-slate-700 dark:bg-slate-900",
      )}
      style={{ borderRadius: 10 }}
    >
      {icon}
      <p className="text-[13px] font-medium text-slate-700 dark:text-slate-200">{text}</p>
    </div>
  );
}
