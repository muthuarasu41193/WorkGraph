"use client";

import { motion } from "framer-motion";
import { Bookmark, MapPin, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import type { JobMatchPreview } from "../../../lib/profile-mock-data";
import { MOCK_JOB_MATCHES } from "../../../lib/profile-mock-data";
import ProfileCard from "../primitives/ProfileCard";
import ProfileBadge from "../primitives/ProfileBadge";
import ProfileButton from "../primitives/ProfileButton";
import SectionHeader from "../primitives/SectionHeader";

type Props = {
  jobs?: JobMatchPreview[];
};

export default function ProfileJobMatches({ jobs = MOCK_JOB_MATCHES }: Props) {
  const [saved, setSaved] = useState<Set<string>>(new Set());

  return (
    <ProfileCard id="matches" padding="lg">
      <SectionHeader
        icon={Sparkles}
        eyebrow="Opportunities"
        title="Top job matches"
        description="Roles aligned to your skills with live match scoring."
      />

      <div className="flex gap-4 overflow-x-auto pb-2 wg-no-scrollbar snap-x snap-mandatory">
        {jobs.map((job, i) => (
          <motion.article
            key={job.id}
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -4 }}
            className="w-[min(100%,320px)] shrink-0 snap-start rounded-2xl border border-[var(--wg-color-border)] bg-[var(--wg-color-surface-variant)]/40 p-5 shadow-sm"
          >
            <motion.div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-[var(--wg-color-text-tertiary)]">{job.company}</p>
                <h3 className="mt-0.5 font-semibold text-[var(--wg-color-text-primary)]">{job.title}</h3>
              </div>
              <span className="rounded-xl bg-[var(--wg-color-success)]/15 px-2 py-1 text-sm font-bold tabular-nums text-[var(--wg-color-success)]">
                {job.matchPercent}%
              </span>
            </motion.div>

            <p className="mt-2 text-sm font-medium text-[var(--wg-color-text-secondary)]">{job.salaryRange}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-[var(--wg-color-text-tertiary)]">
              <MapPin className="h-3.5 w-3.5" />
              {job.location}
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <ProfileBadge tone={job.workMode === "Remote" ? "success" : "info"}>{job.workMode}</ProfileBadge>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <ProfileButton variant="primary" className="flex-1 py-2 text-xs" icon={<Zap className="h-3.5 w-3.5" />}>
                Easy apply
              </ProfileButton>
              <button
                type="button"
                onClick={() =>
                  setSaved((prev) => {
                    const next = new Set(prev);
                    if (next.has(job.id)) next.delete(job.id);
                    else next.add(job.id);
                    return next;
                  })
                }
                className={[
                  "inline-flex h-10 w-10 items-center justify-center rounded-xl border transition",
                  saved.has(job.id)
                    ? "border-[var(--wg-color-primary)] bg-[var(--wg-color-primary)]/10 text-[var(--wg-color-primary)] wg-bookmark-bounce"
                    : "border-[var(--wg-color-border)]",
                ].join(" ")}
                aria-label={saved.has(job.id) ? "Unsave job" : "Save job"}
              >
                <Bookmark className={`h-4 w-4 ${saved.has(job.id) ? "fill-current" : ""}`} />
              </button>
            </div>
          </motion.article>
        ))}
      </div>
    </ProfileCard>
  );
}
