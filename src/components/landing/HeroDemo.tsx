"use client";

import { useEffect, useState } from "react";

const CALLS = [
  { label: "index.search", status: "200", delay: 0 },
  { label: "match.estimate", status: "200", delay: 1 },
  { label: "tracker.save", status: "200", delay: 2 },
  { label: "vault.open", status: "200", delay: 3 },
] as const;

const CHECKS = [
  "Listing opened from the index",
  "Match note shown as an estimate",
  "Role saved to the tracker",
  "Prep pack available to read",
] as const;

/**
 * Animated product stage — Stateweave-style overlapping product panels.
 * Purely illustrative chrome; no live API calls.
 */
export function HeroDemo() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setTick(CHECKS.length);
      return;
    }

    const id = window.setInterval(() => {
      setTick((value) => (value >= CHECKS.length ? 0 : value + 1));
    }, 1600);
    return () => window.clearInterval(id);
  }, []);

  const passed = Math.min(tick, CHECKS.length);

  return (
    <div className="wg-stage" aria-hidden="true">
      <div className="wg-stage__glow" />

      <div className="wg-panel wg-panel--task">
        <div className="wg-panel__bar">
          <span className="wg-panel__dots">
            <i />
            <i />
            <i />
          </span>
          <span>Task · search &amp; save</span>
          <span className="wg-panel__pill">agent@workgraph</span>
        </div>
        <p className="wg-panel__prompt">
          Find remote product roles in the live index, open one listing, save it,
          and open interview prep if it exists.
        </p>
        <div className="wg-panel__block">
          <p className="wg-panel__block-title">Your search calls · {passed} recorded</p>
          <ul className="wg-call-list">
            {CALLS.map((call, index) => (
              <li
                key={call.label}
                className={index < passed ? "is-on" : undefined}
                style={{ transitionDelay: `${call.delay * 80}ms` }}
              >
                <span className="wg-call-list__n">{index + 1}.</span>
                <code>{call.label}</code>
                <span className="wg-call-list__ok">{call.status}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="wg-panel__block">
          <p className="wg-panel__block-title">Checks read from the product</p>
          <ul className="wg-check-list">
            {CHECKS.map((check, index) => (
              <li key={check} className={index < passed ? "is-on" : undefined}>
                <span className="wg-check-list__mark" />
                {check}
              </li>
            ))}
          </ul>
          <p className="wg-panel__status">
            {passed >= CHECKS.length
              ? `Passed · ${CHECKS.length} of ${CHECKS.length} checks`
              : `Running · ${passed} of ${CHECKS.length} checks`}
          </p>
        </div>
      </div>

      <div className="wg-panel wg-panel--jobs">
        <div className="wg-panel__bar">
          <span>Live index</span>
          <span className="wg-panel__muted">illustrative</span>
        </div>
        <ul className="wg-job-rows">
          <li className={passed >= 1 ? "is-active" : undefined}>
            <div>
              <strong>Senior product designer</strong>
              <span>Northwind · Remote</span>
            </div>
            <em>Today</em>
          </li>
          <li>
            <div>
              <strong>Staff engineer</strong>
              <span>Atlas Health · Hybrid</span>
            </div>
            <em>2d</em>
          </li>
          <li>
            <div>
              <strong>Product manager</strong>
              <span>Fieldline · On-site</span>
            </div>
            <em>5d</em>
          </li>
        </ul>
      </div>

      <div className="wg-panel wg-panel--match">
        <div className="wg-panel__bar">
          <span>Match note</span>
          <span className="wg-panel__muted">estimate</span>
        </div>
        <p className="wg-match__score">{passed >= 2 ? "82" : "—"}</p>
        <p className="wg-match__caption">
          Estimate from your profile when one is available — not a hiring
          probability.
        </p>
        <div className="wg-match__bar">
          <span style={{ width: passed >= 2 ? "82%" : "12%" }} />
        </div>
      </div>

      <div className="wg-panel wg-panel--tracker">
        <div className="wg-panel__bar">
          <span>Tracker</span>
          <span className="wg-panel__muted">board</span>
        </div>
        <div className="wg-tracker-cols">
          <div>
            <p>Saved</p>
            <span className={passed >= 3 ? "is-on" : undefined}>Northwind</span>
          </div>
          <div>
            <p>Applied</p>
            <span>Atlas</span>
          </div>
          <div>
            <p>Interview</p>
            <span className={passed >= 4 ? "is-on" : undefined}>Vault open</span>
          </div>
        </div>
      </div>
    </div>
  );
}
