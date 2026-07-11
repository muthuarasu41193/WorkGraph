import Link from "next/link";
import { ArrowRight, FileUp, Radar, Search } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";

export default function ProfileQuickActions({ userFirstName }: { userFirstName: string }) {
  const name = userFirstName.trim() || "there";

  return (
    <section className="overflow-hidden rounded-xl border border-[#DADCE0] bg-[#FFFFFF] p-6">
      <div>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8E8E93]">Next steps</p>
            <h2 className="text-pretty text-[18px] font-semibold text-[#2C2C2E]">
              Hey {name} — keep momentum after your resume parse.
            </h2>
            <p className="max-w-xl text-sm font-normal leading-relaxed text-[#3A3A3C]">
              Refresh your file, tighten ATS gaps, then skim matched roles from boards you&apos;ll connect next.
            </p>
          </div>

          <nav className="flex flex-shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end" aria-label="Profile actions">
            <Link
              href="/create-profile"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A73E8] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#1557B0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A73E8] focus-visible:ring-offset-2 sm:w-auto"
            >
              <FileUp className={iconClass("inline", "shrink-0")} aria-hidden />
              Upload new resume
              <ArrowRight className={iconClass("inline", "shrink-0 opacity-70 transition group-hover:translate-x-0.5")} aria-hidden />
            </Link>
            <a
              href="#ats-score"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#DADCE0] bg-[#FFFFFF] px-4 py-3 text-sm font-medium text-[#3A3A3C] transition hover:shadow-[0_1px_3px_rgba(0,0,0,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A73E8] focus-visible:ring-offset-2 sm:w-auto"
            >
              <Radar className={iconClass("inline", "shrink-0 text-[#1A73E8]")} aria-hidden />
              Improve ATS score
            </a>
            <a
              href="#recommended-jobs"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#DADCE0] bg-[#E8F0FE] px-4 py-3 text-sm font-medium text-[#1557B0] transition hover:shadow-[0_1px_3px_rgba(0,0,0,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A73E8] focus-visible:ring-offset-2 sm:w-auto"
            >
              <Search className={iconClass("inline", "shrink-0 text-[#1A73E8]")} aria-hidden />
              Browse matches
            </a>
          </nav>
        </div>
      </div>
    </section>
  );
}
