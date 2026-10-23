/**
 * Prints docs/MATCHING_AUDIT.md from a recruiting fixture.
 * The before column is scripts/job-match-before.ts (the scorer before this change).
 * The after column is lib/job-match.ts.
 * This environment cannot read the owner's production profile or the jobs table.
 */
import { writeFileSync } from "node:fs";
import { scoreJobCard as scoreBefore } from "./job-match-before";
import { PROFILE_MATCH_MIN_PERCENT, scoreJobCard as scoreAfter } from "../lib/job-match";

const NOW = Date.now();

const PROFILE = {
  skills: [
    "Technical recruiting",
    "Talent acquisition",
    "Sourcing",
    "Boolean search",
    "Applicant tracking systems",
    "Stakeholder management",
    "Interviewing",
    "Offer negotiation",
    "LinkedIn Recruiter",
  ],
  headline: "Technical Recruiter",
  summary:
    "Recruiting for engineering and product teams. Full-cycle talent acquisition, stakeholder management, and offer negotiation.",
};

function daysAgo(days: number): string {
  return new Date(NOW - days * 86_400_000).toISOString();
}

const JOBS: { title: string; description: string; days: number }[] = [
  {
    title: "Chief Engineer",
    description:
      "Lead the engineering organization. 15+ years building distributed systems, hiring engineers, and setting technical direction.",
    days: 10,
  },
  {
    title: "Senior Chief Engineer",
    description: "Senior chief engineer for platform reliability and architecture reviews.",
    days: 12,
  },
  {
    title: "Staff Software Engineer",
    description: "Staff engineer for backend services. Mentor senior engineers and own design reviews.",
    days: 4,
  },
  {
    title: "VP of Engineering",
    description: "Vice president of engineering. Set org design and partner with leadership.",
    days: 20,
  },
  {
    title: "Director of Engineering",
    description: "Director leading several engineering teams and delivery planning.",
    days: 8,
  },
  {
    title: "Engineering Manager",
    description: "Manage a team of software engineers. Run planning and coaching.",
    days: 6,
  },
  {
    title: "Full Stack Engineer",
    description: "Build product features in TypeScript and React.",
    days: 3,
  },
  {
    title: "Senior Technical Recruiter",
    description:
      "Full-cycle technical recruiting, sourcing, boolean search, and offer negotiation in our applicant tracking system. Interviewing and stakeholder management.",
    days: 2,
  },
  {
    title: "Technical Recruiter",
    description: "Technical recruiting and sourcing for product teams. Boolean search and interviewing.",
    days: 1,
  },
  {
    title: "Technical Recruiter",
    description: "Technical recruiting and sourcing for product teams. Boolean search and interviewing.",
    days: 139,
  },
  {
    title: "Talent Acquisition Partner",
    description: "Talent acquisition partner for engineering hiring. Sourcing and stakeholder management.",
    days: 5,
  },
  {
    title: "Technical Sourcer",
    description: "Sourcing and boolean search for technical roles. LinkedIn Recruiter daily.",
    days: 3,
  },
  {
    title: "Recruiting Coordinator",
    description: "Schedule interviewing loops and keep the applicant tracking system current.",
    days: 7,
  },
  {
    title: "Head of Talent",
    description: "Lead talent acquisition, sourcing, and offer negotiation for the company.",
    days: 9,
  },
  {
    title: "Senior Recruiter",
    description: "Senior recruiter covering technical recruiting and stakeholder management.",
    days: 11,
  },
  {
    title: "People Operations Partner",
    description: "People operations, policy, and employee relations. Not a recruiting role.",
    days: 15,
  },
  {
    title: "Product Manager",
    description: "Own the roadmap and write requirements for the product team.",
    days: 6,
  },
  {
    title: "Product Designer",
    description: "Design product flows and partner with research.",
    days: 14,
  },
  {
    title: "Data Analyst",
    description: "Analyze product metrics and build dashboards.",
    days: 18,
  },
  {
    title: "Account Executive",
    description: "Close new business and manage a sales quota.",
    days: 4,
  },
  {
    title: "Sales Development Representative",
    description: "Outbound sales prospecting and meeting setting.",
    days: 2,
  },
  {
    title: "Marketing Manager",
    description: "Own campaigns, messaging, and demand generation.",
    days: 21,
  },
  {
    title: "Customer Support Specialist",
    description: "Answer customer tickets and document known issues.",
    days: 16,
  },
  {
    title: "Registered Nurse",
    description: "Provide inpatient nursing care on a hospital unit.",
    days: 13,
  },
  {
    title: "Staff Accountant",
    description: "Close the books and reconcile accounts.",
    days: 25,
  },
  {
    title: "High School Teacher",
    description: "Teach secondary classes and grade student work.",
    days: 30,
  },
];

type Row = {
  title: string;
  days: number;
  beforePercent: number;
  beforeScore: number;
  afterPercent: number;
  afterScore: number;
  skill: number;
  family: number;
  seniority: number;
  freshness: number;
  matched: string;
};

const rows: Row[] = JOBS.map((job) => {
  const input = { title: job.title, description: job.description, postedAtIso: daysAgo(job.days) };
  const before = scoreBefore(input, PROFILE);
  const after = scoreAfter(input, PROFILE, NOW);
  return {
    title: job.days > 30 ? `${job.title} (${job.days}d)` : job.title,
    days: job.days,
    beforePercent: before.matchPercent,
    beforeScore: before.score,
    afterPercent: after.matchPercent,
    afterScore: after.score,
    skill: after.subScores.skillOverlap,
    family: after.subScores.titleFamily,
    seniority: after.subScores.seniority,
    freshness: after.subScores.freshness,
    matched: after.matchedSkills.join(", ") || "—",
  };
});

const chief = rows.find((row) => row.title === "Chief Engineer");
if (!chief || chief.beforePercent !== 53) {
  throw new Error(`Expected the frozen scorer to give Chief Engineer 53%, got ${chief?.beforePercent}`);
}

function top(list: Row[], key: "beforeScore" | "afterScore"): Row[] {
  return [...list].sort((a, b) => b[key] - a[key] || a.title.localeCompare(b.title)).slice(0, 20);
}

function table(list: Row[], which: "before" | "after"): string {
  const header =
    which === "before"
      ? "| # | Title | % | raw score |"
      : "| # | Title | % | rank | skill | family | seniority | freshness | matched skills |";
  const rule =
    which === "before"
      ? "|---|---|---:|---:|"
      : "|---|---|---:|---:|---:|---:|---:|---:|---|";
  const lines = list.map((row, index) =>
    which === "before"
      ? `| ${index + 1} | ${row.title} | ${row.beforePercent} | ${row.beforeScore} |`
      : `| ${index + 1} | ${row.title} | ${row.afterPercent} | ${row.afterScore} | ${row.skill} | ${row.family} | ${row.seniority} | ${row.freshness} | ${row.matched} |`,
  );
  return [header, rule, ...lines].join("\n");
}

const afterVisible = rows.filter((row) => row.afterPercent >= PROFILE_MATCH_MIN_PERCENT).length;

const markdown = `# Matching audit

**Data:** fixture, not the owner's production profile and not the production jobs table. This environment has no session and no database credentials for that account. The profile below is a representative recruiting skill set (9 skills) used to reproduce the Chief Engineer case.

**Profile**

- Headline: ${PROFILE.headline}
- Summary: ${PROFILE.summary}
- Skills: ${PROFILE.skills.join(", ")}

**Before** is the scorer that was in \`lib/job-match.ts\` immediately before the reweight (\`scripts/job-match-before.ts\`). **After** is the current scorer. Rank is the sort key. The displayed percent is separate from rank so a stale job can sort lower without pretending the skill overlap changed by the same amount.

## Why Chief Engineer scored 53%

The frozen scorer gives this fixture's Chief Engineer **${chief.beforePercent}%** with raw score **${chief.beforeScore}** and **no matched skills**.

The old percent was not a share of overlapping skills. With any skills on the profile it was:

\`matchPercent = clamp(round(52 + (score / maxRealistic) * 44), 48, 98)\`

\`maxRealistic = 12 * min(skillCount, 8) + 24\`. For 9 skills that is 120. A job with zero skill overlap was then capped:

\`if (matchedSkills.length === 0) score = min(score, 2)\`

Words from the headline and summary ("recruiting", "engineering", "teams", "management", and the seniority list) still added points before that cap. Chief Engineer's description mentions engineering and hiring, so those terms produced a small score, the cap reduced it to 2, and the formula became \`round(52 + (2 / 120) * 44) = 53\`. The 48 floor meant an unrelated job could not display below 48%. Seniority words in the title were just more of those loose terms. They were not a smaller weight than skill overlap.

## After

Skill overlap (up to 70) and title-family agreement (22 when the headline and skills share a family with the job title) outrank seniority (4, and only when both sides use the same seniority word). Jobs older than 30 days lose 40 rank points and 5 display points, and the card says the posting may no longer be open. Results under ${PROFILE_MATCH_MIN_PERCENT}% are hidden from the profile-match view. ${afterVisible} of ${rows.length} fixture rows stay visible under that floor.

## Before, top 20

${table(top(rows, "beforeScore"), "before")}

## After, top 20

${table(top(rows, "afterScore"), "after")}
`;

writeFileSync(new URL("../docs/MATCHING_AUDIT.md", import.meta.url), markdown);
console.log(`Wrote docs/MATCHING_AUDIT.md (Chief Engineer before ${chief.beforePercent}%, after ${chief.afterPercent}%)`);
