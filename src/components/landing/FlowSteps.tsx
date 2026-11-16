"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { Reveal } from "./Reveal";

const STEPS = [
  {
    id: "search",
    label: "Search",
    title: "Look through the live index",
    body: "An account is not required. Search listings we store and open any role that fits.",
  },
  {
    id: "read",
    label: "Read",
    title: "See what we actually know",
    body: "Each listing shows where it was posted and the stored date. Trust notes appear only when a link or company name is missing.",
  },
  {
    id: "match",
    label: "Match",
    title: "Get a match note when you have a profile",
    body: "Match notes are estimates from the profile we compare — not a hiring probability. Search still works without a profile.",
  },
  {
    id: "track",
    label: "Track",
    title: "Sign in to save or log applications",
    body: "Create an account when you want to save a role, keep an application record, or move stages on the tracker.",
  },
  {
    id: "prep",
    label: "Prep",
    title: "Use Interview Vault and prep packs",
    body: "Read free prep packs for a role, or open Interview Vault when you want candidate-written guides from people who interviewed.",
  },
  {
    id: "apply",
    label: "Apply",
    title: "Apply on the company site",
    body: "WorkGraph does not invent apply links. When a listing has one, you leave to the employer’s site to submit.",
  },
] as const;

export function FlowSteps() {
  const [active, setActive] = useState(0);
  const labelId = useId();
  const step = STEPS[active] ?? STEPS[0];

  const go = useCallback((next: number) => {
    setActive((next + STEPS.length) % STEPS.length);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        go(active + 1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(active - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, go]);

  return (
    <Reveal
      as="section"
      className="wg-section wg-flow"
      id="how-it-works"
      aria-labelledby="flow-heading"
    >
      <div className="wg-container">
        <div className="wg-flow__intro">
          <p className="wg-eyebrow">From search to apply</p>
          <h2 id="flow-heading" className="wg-section__title">
            Six calm steps. Click one, or use the arrow keys.
          </h2>
        </div>

        <div className="wg-flow__tabs" role="tablist" aria-label="How WorkGraph works">
          {STEPS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${labelId}-${item.id}`}
              aria-selected={index === active}
              aria-controls={`${labelId}-panel`}
              className={index === active ? "is-active" : undefined}
              onClick={() => setActive(index)}
            >
              <span className="wg-flow__n">
                {String(index + 1).padStart(2, "0")}
              </span>
              {item.label}
            </button>
          ))}
        </div>

        <div
          className="wg-flow__panel"
          role="tabpanel"
          id={`${labelId}-panel`}
          aria-labelledby={`${labelId}-${step.id}`}
        >
          <p className="wg-flow__step-label">
            {String(active + 1).padStart(2, "0")} · {step.label}
          </p>
          <h3>{step.title}</h3>
          <p>{step.body}</p>
          <div className="wg-flow__nav">
            <button type="button" onClick={() => go(active - 1)}>
              Previous
            </button>
            <button type="button" onClick={() => go(active + 1)}>
              Next
            </button>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
