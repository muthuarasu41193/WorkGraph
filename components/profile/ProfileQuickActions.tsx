import Link from "next/link";
import { ArrowRight, FileUp, Radar, Search } from "lucide-react";

export default function ProfileQuickActions({ userFirstName }: { userFirstName: string }) {
  const name = userFirstName.trim() || "there";

  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 p-[1px] shadow-lg shadow-emerald-900/15">
      <div className="rounded-[calc(1.5rem-1px)] bg-gradient-to-br from-emerald-950/95 via-teal-950/98 to-emerald-950 px-5 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400/90">Next steps</p>
            <h2 className="text-pretty text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Hey {name} — keep momentum after your resume parse.
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-emerald-100/85">
              Refresh your file, tighten ATS gaps, then skim matched roles from boards you&apos;ll connect next.
            </p>
          </div>

          <nav className="flex flex-shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end" aria-label="Profile actions">
            <Link
              href="/create-profile"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-emerald-950 shadow-md transition hover:bg-emerald-50"
            >
              <FileUp className="h-4 w-4 shrink-0" aria-hidden />
              Upload new resume
              <ArrowRight className="h-4 w-4 shrink-0 opacity-70 transition group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <a
              href="#ats-score"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/35 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-emerald-500/25"
            >
              <Radar className="h-4 w-4 shrink-0 text-emerald-200" aria-hidden />
              Improve ATS score
            </a>
            <a
              href="#recommended-jobs"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
            >
              <Search className="h-4 w-4 shrink-0 text-emerald-200" aria-hidden />
              Browse matches
            </a>
          </nav>
        </div>
      </div>
    </section>
  );
}
