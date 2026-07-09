"use client";

import { useApplyFollowupStore } from "@/stores/apply-followup-store";
import { emitNavFeedback } from "@/lib/nav-feedback-events";

type Props = {
  onMarkApplied?: (job: { jobId: string; company: string; title: string; applyUrl: string }) => Promise<void> | void;
  onSaveForLater?: (jobId: string) => void;
};

export default function ApplyFollowupPrompt({ onMarkApplied, onSaveForLater }: Props) {
  const active = useApplyFollowupStore((s) => s.active);
  const dismiss = useApplyFollowupStore((s) => s.dismiss);

  if (!active) return null;

  async function handleApplied() {
    try {
      await onMarkApplied?.(active!);
      emitNavFeedback("applications", "glow");
    } finally {
      dismiss();
    }
  }

  function handleNotYet() {
    onSaveForLater?.(active!.jobId);
    emitNavFeedback("hidden-jobs", "pulse");
    dismiss();
  }

  return (
    <div
      className="apply-followup pointer-events-auto fixed bottom-20 right-4 z-[120] w-full max-w-sm md:bottom-6"
      role="dialog"
      aria-labelledby="apply-followup-title"
      aria-describedby="apply-followup-desc"
    >
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
        <p id="apply-followup-title" className="text-sm font-semibold text-slate-900">
          Did you apply to this role?
        </p>
        <p id="apply-followup-desc" className="mt-1 text-sm text-slate-500">
          {active.company} · {active.title}
        </p>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => void handleApplied()} className="apply-followup__primary">
            Yes, I applied
          </button>
          <button type="button" onClick={handleNotYet} className="apply-followup__secondary">
            Not yet
          </button>
        </div>
      </div>
    </div>
  );
}
