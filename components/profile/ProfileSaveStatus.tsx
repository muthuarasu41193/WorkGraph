"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
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
    });

    const offSaved = onProfileSaved((savedSection) => {
      if (saveAllCompleted) {
        setSaveAllPending((prev) => prev.filter((item) => item !== savedSection));
        return;
      }
      setSavedAt(new Date());
      setSection(savedSection);
      setState("saved");
    });
    const offStart = onProfileSaveStart((savingSection) => {
      setSection(savingSection);
      setState("saving");
      setErrorMessage("");
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
    });
    return () => {
      offSaveAllBegin();
      offSaved();
      offStart();
      offError();
    };
  }, [saveAllCompleted]);

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
      <Loader2 className="h-4 w-4 animate-spin text-emerald-700" aria-hidden />
    ) : state === "error" ? (
      <AlertCircle className="h-4 w-4 text-red-600" aria-hidden />
    ) : (
      <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
    );

  return (
    <div className="fixed bottom-5 right-5 z-40 rounded-2xl border border-emerald-200/90 bg-white/95 px-4 py-3 shadow-lg shadow-emerald-900/10 backdrop-blur-sm">
      <div className="flex items-center gap-2.5">
        {icon}
        <p className="text-xs font-medium text-slate-700">{text}</p>
      </div>
    </div>
  );
}
