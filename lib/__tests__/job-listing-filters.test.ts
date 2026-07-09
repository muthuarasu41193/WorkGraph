import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { RecommendedJobCard } from "../job-dashboard";
import {
  applyClientOnlyJobListingFilters,
  applyJobListingFilters,
  hasClientOnlyJobFilters,
  needsJobClientFilterPool,
  type DerivedJobMeta,
  type EnrichedJobRow,
  type JobListingFilterState,
} from "../job-listing-filters";

function baseJob(overrides: Partial<RecommendedJobCard> = {}): RecommendedJobCard {
  return {
    id: "job-1",
    title: "Senior Software Engineer",
    company: "Acme Corp",
    location: "San Francisco, CA",
    description: "Full-time senior role building SaaS products. 5+ years experience required.",
    source: "greenhouse",
    matchLabel: "82% match",
    postedAgo: "2d ago",
    postedAtIso: new Date().toISOString(),
    kind: "listing",
    classification: "employer_hiring",
    isCommunity: false,
    matchedSkills: ["typescript", "react"],
    applyUrl: "https://example.com/apply",
    ...overrides,
  };
}

function baseMeta(overrides: Partial<DerivedJobMeta> = {}): DerivedJobMeta {
  return {
    searchBlob:
      "senior software engineer acme corp san francisco full-time senior role building saas products 5+ years experience required typescript react",
    jobTypes: ["Full-time"],
    primaryJobType: "Full-time",
    locationMode: "onsite",
    experienceLevel: "Senior (5-8yr)",
    salary: { minK: 150, maxK: 180, currency: "USD", period: "year" },
    companySize: "Medium (201-1000)",
    industries: ["Technology"],
    benefits: ["Health", "401k"],
    hasVisaSponsorship: false,
    isEasyApply: true,
    ...overrides,
  };
}

function row(
  job: RecommendedJobCard,
  meta: DerivedJobMeta = baseMeta(),
  score = 82
): EnrichedJobRow {
  return { job, meta, score };
}

function emptyState(overrides: Partial<JobListingFilterState> = {}): JobListingFilterState {
  return {
    q: "",
    dateWindow: "any",
    sources: new Set(),
    locationMode: "any",
    locationQuery: "",
    companyQuery: "",
    jobTypes: new Set(),
    matchScore: "any",
    skillsPick: new Set(),
    experienceLevel: "any",
    salaryFilterActive: false,
    salaryMin: 0,
    salaryMax: 500,
    currency: "USD",
    salaryPeriod: "year",
    companySize: "any",
    industries: new Set(),
    normalizedRequiredSkills: [],
    benefits: new Set(),
    visaSponsorshipOnly: false,
    easyApplyOnly: false,
    ...overrides,
  };
}

describe("job-listing-filters", () => {
  it("detects client-only filters and profile-match pool mode", () => {
    assert.equal(hasClientOnlyJobFilters(emptyState()), false);
    assert.equal(hasClientOnlyJobFilters(emptyState({ matchScore: "75" })), true);
    assert.equal(needsJobClientFilterPool(emptyState()), false);
    assert.equal(needsJobClientFilterPool(emptyState(), { profileMatchesOnly: true }), true);
  });

  it("filters search terms with AND semantics", () => {
    const jobs = [
      row(baseJob()),
      row(
        baseJob({
          id: "job-2",
          title: "Product Manager",
          description: "Own roadmap for growth team",
        }),
        baseMeta({
          searchBlob: "product manager acme corp growth team",
          jobTypes: [],
          experienceLevel: null,
          salary: null,
        }),
        60
      ),
    ];

    const filtered = applyJobListingFilters(jobs, emptyState({ q: "senior saas" }));
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]?.job.id, "job-1");
  });

  it("filters by remote location mode including remote boards", () => {
    const remoteBoardJob = row(
      baseJob({
        id: "remote-board",
        source: "remoteok",
        location: "Worldwide",
        description: "Backend engineer role",
      }),
      baseMeta({
        searchBlob: "backend engineer worldwide",
        locationMode: "onsite",
      })
    );
    const onsiteJob = row(baseJob({ id: "onsite" }));

    const filtered = applyJobListingFilters(jobsFrom(remoteBoardJob, onsiteJob), emptyState({ locationMode: "remote" }));
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]?.job.id, "remote-board");
  });

  it("filters by job type using title hints", () => {
    const internJob = row(
      baseJob({
        id: "intern",
        title: "Software Engineering Intern",
        description: "Join our platform team for the summer",
      }),
      baseMeta({
        searchBlob: "software engineering intern platform team summer",
        jobTypes: [],
        experienceLevel: "Entry (0-2yr)",
      })
    );

    const filtered = applyJobListingFilters(
      jobsFrom(internJob, row(baseJob({ id: "full-time" }))),
      emptyState({ jobTypes: new Set(["Internship"]) })
    );
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]?.job.id, "intern");
  });

  it("filters by match score and salary range", () => {
    const lowScore = row(baseJob({ id: "low" }), baseMeta(), 55);
    const highSalary = row(
      baseJob({ id: "high-salary" }),
      baseMeta({ salary: { minK: 200, maxK: 240, currency: "USD", period: "year" } }),
      90
    );

    const byScore = applyClientOnlyJobListingFilters(jobsFrom(lowScore, row(baseJob())), emptyState({ matchScore: "75" }));
    assert.equal(byScore.length, 1);

    const bySalary = applyClientOnlyJobListingFilters(
      jobsFrom(highSalary, row(baseJob())),
      emptyState({ salaryFilterActive: true, salaryMin: 100, salaryMax: 170 })
    );
    assert.equal(bySalary.length, 1);
    assert.equal(bySalary[0]?.job.id, "job-1");
  });

  it("filters required skills with every-skill semantics", () => {
    const filtered = applyClientOnlyJobListingFilters(
      jobsFrom(row(baseJob()), row(baseJob({ id: "missing", matchedSkills: ["react"] }))),
      emptyState({ normalizedRequiredSkills: ["typescript", "react"] })
    );
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]?.job.id, "job-1");
  });

  it("filters benefits using keyword fallback", () => {
    const noMetaBenefits = row(
      baseJob({
        id: "health-text",
        description: "We offer health insurance, 401k, and equity",
      }),
      baseMeta({ benefits: [], searchBlob: "health insurance 401k equity" })
    );

    const filtered = applyClientOnlyJobListingFilters(
      jobsFrom(noMetaBenefits),
      emptyState({ benefits: new Set(["Health", "401k"]) })
    );
    assert.equal(filtered.length, 1);
  });

  it("excludes jobs with invalid posted dates when date window is active", () => {
    const undated = row(baseJob({ id: "undated", postedAtIso: null }));
    const filtered = applyJobListingFilters(jobsFrom(undated, row(baseJob())), emptyState({ dateWindow: "7" }));
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]?.job.id, "job-1");
  });

  it("requires profile overlap when requested", () => {
    const weakMatch = row(
      baseJob({
        id: "weak",
        description: "General operations role with no engineering stack listed",
        matchedSkills: [],
      }),
      baseMeta({ searchBlob: "general operations role" }),
      5
    );
    const strongMatch = row(
      baseJob({
        id: "strong",
        description: "Build products with TypeScript and React across our SaaS platform",
        matchedSkills: ["typescript"],
      }),
      baseMeta({
        searchBlob: "build products with typescript and react across our saas platform",
      }),
      82
    );

    const filtered = applyJobListingFilters(jobsFrom(weakMatch, strongMatch), emptyState(), {
      profile: { skills: ["typescript", "react"] },
      requireProfileOverlap: true,
      minProfileScore: 8,
    });

    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]?.job.id, "strong");
  });

  it("does not crash on malformed job rows", () => {
    const malformed = row(
      {
        ...baseJob(),
        title: undefined as unknown as string,
        company: undefined as unknown as string,
        location: undefined as unknown as string,
        description: undefined as unknown as string,
        matchedSkills: undefined as unknown as string[],
      },
      baseMeta({ searchBlob: "" })
    );

    assert.doesNotThrow(() => {
      const result = applyJobListingFilters(jobsFrom(malformed), emptyState({ q: "engineer" }));
      assert.equal(Array.isArray(result), true);
    });
  });
});

function jobsFrom(...rows: EnrichedJobRow[]): EnrichedJobRow[] {
  return rows;
}
