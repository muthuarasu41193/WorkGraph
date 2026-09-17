"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  CONSENT_POLICY_VERSION,
  OPEN_CONSENT_EVENT,
  acceptAllCategories,
  createConsentRecord,
  needsReprompt,
  readConsent,
  rejectAllCategories,
  reportConsentToServer,
  writeConsent,
  type ConsentCategories,
  type ConsentRecord,
} from "@/lib/consent";

type View = "banner" | "preferences";

const equalActionClass =
  "h-11 w-full rounded-full px-5 text-sm font-semibold text-white transition-colors";

export function ConsentManager() {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("banner");
  const [draft, setDraft] = useState<ConsentCategories>(rejectAllCategories());
  const [anonymousId, setAnonymousId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
    const existing = readConsent();
    if (existing) {
      setAnonymousId(existing.anonymousId);
      setDraft(existing.categories);
    }
    if (needsReprompt(existing)) {
      setView("banner");
      setOpen(true);
    }

    const onOpen = () => {
      const current = readConsent();
      if (current) {
        setAnonymousId(current.anonymousId);
        setDraft(current.categories);
        setView("preferences");
      } else {
        setView("banner");
      }
      setOpen(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, onOpen);
  }, []);

  if (!mounted) return null;

  const persist = (categories: ConsentCategories) => {
    const record: ConsentRecord = createConsentRecord(categories, anonymousId);
    setAnonymousId(record.anonymousId);
    setDraft(record.categories);
    writeConsent(record);
    reportConsentToServer(record);
    setOpen(false);
    setView("banner");
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl rounded-2xl border border-border-default bg-surface p-5 shadow-xl sm:inset-x-6"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Cookies</p>
          <h2 id={titleId} className="mt-2 font-heading text-lg font-bold text-fg-primary">
            {view === "preferences" ? "Cookie preferences" : "We use cookies"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-fg-secondary">
            Strictly necessary cookies run sign-in and remember this choice (policy v
            {CONSENT_POLICY_VERSION}). Analytics and marketing stay off until you opt in. Read the{" "}
            <Link href="/legal/cookies" className="font-semibold text-brand underline-offset-4 hover:underline">
              Cookie Policy
            </Link>{" "}
            and{" "}
            <Link href="/legal/privacy" className="font-semibold text-brand underline-offset-4 hover:underline">
              Privacy Policy
            </Link>
            . You can withdraw anytime via Cookie preferences in the footer.
          </p>

          {view === "preferences" ? (
            <fieldset className="mt-4 space-y-3">
              <legend className="sr-only">Consent categories</legend>
              <CategoryRow
                title="Strictly necessary"
                description="Sign-in, security, and storing your cookie choice. Always on."
                checked
                disabled
              />
              <CategoryRow
                title="Analytics"
                description="First-party usage measurement to improve the product. Off until you allow it."
                checked={draft.analytics}
                onChange={(analytics) => setDraft((current) => ({ ...current, analytics }))}
              />
              <CategoryRow
                title="Marketing"
                description="Campaign and advertising measurement. Off until you allow it. No marketing scripts load without this."
                checked={draft.marketing}
                onChange={(marketing) => setDraft((current) => ({ ...current, marketing }))}
              />
            </fieldset>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              className={`${equalActionClass} bg-slate-800 hover:bg-slate-700`}
              onClick={() => persist(rejectAllCategories())}
            >
              Reject all
            </button>
            <button
              type="button"
              className={`${equalActionClass} bg-brand hover:bg-brand-700`}
              onClick={() => persist(acceptAllCategories())}
            >
              Accept all
            </button>
          </div>

          {view === "banner" ? (
            <button
              type="button"
              className="mt-3 w-full py-2 text-sm font-semibold text-fg-secondary underline-offset-4 hover:text-brand hover:underline"
              onClick={() => setView("preferences")}
            >
              Manage preferences
            </button>
          ) : (
            <button
              type="button"
              className="mt-3 w-full rounded-full border border-border-default py-2.5 text-sm font-semibold text-fg-secondary hover:bg-surface-active"
              onClick={() => persist({ ...draft, strictlyNecessary: true })}
            >
              Save choices
            </button>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function CategoryRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-border-default px-3 py-3">
      <span>
        <span className="block text-sm font-semibold text-fg-primary">{title}</span>
        <span className="mt-1 block text-xs leading-relaxed text-fg-tertiary">{description}</span>
      </span>
      <input
        type="checkbox"
        className="mt-1 size-4 shrink-0 accent-brand"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
      />
    </label>
  );
}
