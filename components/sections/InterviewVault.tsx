"use client";

import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Difficulty = "Easy" | "Medium" | "Hard";

type Company = {
  name: string;
  initial: string;
  color: string;
  interviews: number;
  commonRole: string;
  difficulty: Difficulty;
};

const COMPANIES: Company[] = [
  {
    name: "Google",
    initial: "G",
    color: "bg-[#4285F4]",
    interviews: 247,
    commonRole: "Senior Software Engineer",
    difficulty: "Hard",
  },
  {
    name: "Meta",
    initial: "M",
    color: "bg-[#0668E1]",
    interviews: 189,
    commonRole: "Software Engineer",
    difficulty: "Medium",
  },
  {
    name: "Amazon",
    initial: "A",
    color: "bg-[#FF9900]",
    interviews: 312,
    commonRole: "SDE II",
    difficulty: "Hard",
  },
  {
    name: "Microsoft",
    initial: "Ms",
    color: "bg-[#00A4EF]",
    interviews: 198,
    commonRole: "Software Engineer",
    difficulty: "Medium",
  },
  {
    name: "Apple",
    initial: "A",
    color: "bg-[#555555]",
    interviews: 156,
    commonRole: "iOS Engineer",
    difficulty: "Medium",
  },
  {
    name: "Stripe",
    initial: "S",
    color: "bg-[#635BFF]",
    interviews: 89,
    commonRole: "Backend Engineer",
    difficulty: "Hard",
  },
  {
    name: "Airbnb",
    initial: "Ab",
    color: "bg-[#FF5A5F]",
    interviews: 134,
    commonRole: "Product Manager",
    difficulty: "Medium",
  },
  {
    name: "Netflix",
    initial: "N",
    color: "bg-[#E50914]",
    interviews: 67,
    commonRole: "Senior Engineer",
    difficulty: "Hard",
  },
];

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  Easy: "bg-[#F0FDF4] text-[#16A34A]",
  Medium: "bg-[#FFF7ED] text-[#D97706]",
  Hard: "bg-[#FFF0F0] text-[#C41E3A]",
};

function CompanyCard({ company, active }: { company: Company; active?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-3.5 transition-all duration-200 hover:border-[#C41E3A]/60",
        active && "border-[#C41E3A]/80 ring-1 ring-[#C41E3A]/30",
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white",
          company.color,
        )}
        aria-hidden
      >
        {company.initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-semibold text-white">{company.name}</p>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
              DIFFICULTY_STYLES[company.difficulty],
            )}
          >
            {company.difficulty}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-[#8A8A8A]">
          {company.interviews} interviews · {company.commonRole}
        </p>
      </div>
    </div>
  );
}

export default function InterviewVault() {
  return (
    <section
      id="interview-vault"
      aria-label="Interview Vault"
      className="bg-[#0A0A0A] py-20 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C41E3A]">
            Interview Vault
          </p>
          <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            Know exactly what to expect. Before you walk in.
          </h2>
          <p className="mt-4 text-lg text-[#8A8A8A]">
            10,000+ real interview experiences from candidates at top companies
          </p>
        </header>

        <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Company list */}
          <div className="relative">
            <div
              className="h-[400px] overflow-y-auto rounded-2xl border border-[#2A2A2A] bg-[#141414] p-3 [mask-image:linear-gradient(to_bottom,transparent,black_24px,black_calc(100%-24px),transparent)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="list"
              aria-label="Companies in Interview Vault"
            >
              <div className="space-y-2.5">
                {COMPANIES.map((company, index) => (
                  <CompanyCard key={company.name} company={company} active={index === 0} />
                ))}
              </div>
            </div>
          </div>

          {/* Question preview */}
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A]">
              <div className="border-b border-[#2A2A2A] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-[#4285F4] text-sm font-bold text-white">
                    G
                  </div>
                  <div>
                    <p className="font-semibold text-white">Google</p>
                    <p className="text-sm text-[#8A8A8A]">Senior Software Engineer</p>
                  </div>
                  <span className="ml-auto rounded-full bg-[#2A2A2A] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#8A8A8A]">
                    System Design
                  </span>
                </div>
              </div>

              <div className="relative px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#8A8A8A]">
                  Interview question
                </p>
                <p className="mt-3 text-lg font-medium leading-relaxed text-white">
                  Design a URL shortener that can handle 100M requests per day
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#FFF0F0] px-2.5 py-1 text-[11px] font-semibold text-[#C41E3A]">
                    Hard
                  </span>
                  {["System Design", "Scalability", "Database"].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#2A2A2A] bg-[#141414] px-2.5 py-1 text-[11px] text-[#8A8A8A]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <Button
                  className="mt-6 w-full rounded-full bg-[#C41E3A] text-white hover:bg-[#A01830] sm:w-auto"
                  asChild
                >
                  <Link href="/signup">
                    <Lock className="size-4" aria-hidden />
                    Unlock Full Guide
                  </Link>
                </Button>

                {/* Blurred teaser */}
                <div className="relative mt-6 overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#141414]">
                  <div className="space-y-2 p-4 blur-sm select-none" aria-hidden>
                    <p className="text-sm text-[#8A8A8A]">
                      Sample answer outline: API design, base62 encoding, database sharding...
                    </p>
                    <p className="text-sm text-[#8A8A8A]">
                      Follow-up questions: How would you handle hot keys? Cache strategy?
                    </p>
                    <p className="text-sm text-[#8A8A8A]">
                      Insider tip: They care deeply about trade-off articulation...
                    </p>
                  </div>
                  <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/80 to-transparent pb-4">
                    <p className="px-4 text-center text-sm font-medium text-[#8A8A8A]">
                      Join to see the answer +{" "}
                      <span className="text-white">246 more Google questions</span> →
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 flex flex-col items-center gap-2 text-center">
          <Button
            size="lg"
            className="h-12 rounded-full bg-[#C41E3A] px-8 text-base font-semibold text-white hover:bg-[#A01830]"
            asChild
          >
            <Link href="/signup">
              Start Interview Prep Free
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <p className="text-sm text-[#8A8A8A]">No credit card required</p>
        </div>
      </div>
    </section>
  );
}
