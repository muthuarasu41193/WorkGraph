# Matching audit

**Data:** fixture, not the owner's production profile and not the production jobs table. This environment has no session and no database credentials for that account. The profile below is a representative recruiting skill set (9 skills) used to reproduce the Chief Engineer case.

**Profile**

- Headline: Technical Recruiter
- Summary: Recruiting for engineering and product teams. Full-cycle talent acquisition, stakeholder management, and offer negotiation.
- Skills: Technical recruiting, Talent acquisition, Sourcing, Boolean search, Applicant tracking systems, Stakeholder management, Interviewing, Offer negotiation, LinkedIn Recruiter

**Before** is the scorer that was in `lib/job-match.ts` immediately before the reweight (`scripts/job-match-before.ts`). **After** is the current scorer. Rank is the sort key. The displayed percent is separate from rank so a stale job can sort lower without pretending the skill overlap changed by the same amount.

## Why Chief Engineer scored 53%

The frozen scorer gives this fixture's Chief Engineer **53%** with raw score **2** and **no matched skills**.

The old percent was not a share of overlapping skills. With any skills on the profile it was:

`matchPercent = clamp(round(52 + (score / maxRealistic) * 44), 48, 98)`

`maxRealistic = 12 * min(skillCount, 8) + 24`. For 9 skills that is 120. A job with zero skill overlap was then capped:

`if (matchedSkills.length === 0) score = min(score, 2)`

Words from the headline and summary ("recruiting", "engineering", "teams", "management", and the seniority list) still added points before that cap. Chief Engineer's description mentions engineering and hiring, so those terms produced a small score, the cap reduced it to 2, and the formula became `round(52 + (2 / 120) * 44) = 53`. The 48 floor meant an unrelated job could not display below 48%. Seniority words in the title were just more of those loose terms. They were not a smaller weight than skill overlap.

## After

Skill overlap (up to 70) and title-family agreement (22 when the headline and skills share a family with the job title) outrank seniority (4, and only when both sides use the same seniority word). Jobs older than 30 days lose 40 rank points and 5 display points, and the card says the posting may no longer be open. Results under 40% are hidden from the profile-match view. 7 of 26 fixture rows stay visible under that floor.

## Missing skills

After a page of jobs is already chosen, the card lists skills the posting names that the profile does not show. `extractJobSkills` in `lib/job-requirements.ts` finds whole words from `SKILL_ALIASES` plus the curated `COMMON_NON_TECH_SKILLS` list (stakeholder management, financial modeling, and similar phrases). `missingSkills` drops a skill when the profile already shows it, using the same variants as scoring, so “Node.js” and “nodejs” count as one skill. The list keeps first-seen order, at most 5 names on a card and 10 on the job page. An empty profile produces no list. The line is an estimate from words in the posting, not a hiring probability. It does not change `matchPercent`, rank, the 40% floor, or any weight, and it does not add a database query or a model call. Ranking still scores the candidate set without this extraction.

## Before, top 20

| # | Title | % | raw score |
|---|---|---:|---:|
| 1 | Senior Technical Recruiter | 78 | 70 |
| 2 | Talent Acquisition Partner | 71 | 52 |
| 3 | Technical Recruiter | 70 | 50 |
| 4 | Technical Recruiter (139d) | 69 | 46 |
| 5 | Head of Talent | 66 | 37 |
| 6 | Technical Sourcer | 65 | 35 |
| 7 | Senior Recruiter | 63 | 30 |
| 8 | Recruiting Coordinator | 58 | 15 |
| 9 | Account Executive | 53 | 2 |
| 10 | Chief Engineer | 53 | 2 |
| 11 | Customer Support Specialist | 53 | 2 |
| 12 | Data Analyst | 53 | 2 |
| 13 | Director of Engineering | 53 | 2 |
| 14 | Engineering Manager | 53 | 2 |
| 15 | Full Stack Engineer | 53 | 2 |
| 16 | High School Teacher | 53 | 2 |
| 17 | Marketing Manager | 53 | 2 |
| 18 | People Operations Partner | 53 | 2 |
| 19 | Product Designer | 53 | 2 |
| 20 | Product Manager | 53 | 2 |

## After, top 20

| # | Title | % | rank | skill | family | seniority | freshness | matched skills |
|---|---|---:|---:|---:|---:|---:|---:|---|
| 1 | Senior Technical Recruiter | 82 | 146 | 60 | 22 | 0 | 4 | Technical recruiting, Sourcing, Boolean search, Stakeholder management, Interviewing, Offer negotiation |
| 2 | Talent Acquisition Partner | 66 | 114 | 44 | 22 | 0 | 4 | Talent acquisition, Sourcing, Stakeholder management |
| 3 | Technical Recruiter | 62 | 106 | 40 | 22 | 0 | 4 | Technical recruiting, Sourcing, Boolean search, Interviewing |
| 4 | Technical Sourcer | 52 | 86 | 30 | 22 | 0 | 4 | Sourcing, Boolean search, LinkedIn Recruiter |
| 5 | Head of Talent | 52 | 84 | 30 | 22 | 0 | 2 | Talent acquisition, Sourcing, Offer negotiation |
| 6 | Senior Recruiter | 42 | 64 | 20 | 22 | 0 | 2 | Technical recruiting, Stakeholder management |
| 7 | Technical Recruiter (139d) | 57 | 62 | 40 | 22 | 0 | -40 | Technical recruiting, Sourcing, Boolean search, Interviewing |
| 8 | Recruiting Coordinator | 32 | 46 | 10 | 22 | 0 | 4 | Interviewing |
| 9 | Account Executive | 0 | 4 | 0 | 0 | 0 | 4 | — |
| 10 | Engineering Manager | 0 | 4 | 0 | 0 | 0 | 4 | — |
| 11 | Full Stack Engineer | 0 | 4 | 0 | 0 | 0 | 4 | — |
| 12 | Product Manager | 0 | 4 | 0 | 0 | 0 | 4 | — |
| 13 | Sales Development Representative | 0 | 4 | 0 | 0 | 0 | 4 | — |
| 14 | Staff Software Engineer | 0 | 4 | 0 | 0 | 0 | 4 | — |
| 15 | Chief Engineer | 0 | 2 | 0 | 0 | 0 | 2 | — |
| 16 | Customer Support Specialist | 0 | 2 | 0 | 0 | 0 | 2 | — |
| 17 | Data Analyst | 0 | 2 | 0 | 0 | 0 | 2 | — |
| 18 | Director of Engineering | 0 | 2 | 0 | 0 | 0 | 2 | — |
| 19 | High School Teacher | 0 | 2 | 0 | 0 | 0 | 2 | — |
| 20 | Marketing Manager | 0 | 2 | 0 | 0 | 0 | 2 | — |
