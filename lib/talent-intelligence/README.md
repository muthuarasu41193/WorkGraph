# WorkGraph Talent Intelligence — Resume Intelligence

Flagship feature: honest, evidence-based resume vs. job description analysis.

## Philosophy

> AI should improve authenticity, not replace it.

- Never fabricate experience, projects, or achievements
- Never rewrite the user's resume
- Every gap recommendation uses: *"If you genuinely possess this experience, consider highlighting it more clearly."*

## Architecture

```
User resume (profiles.resume_raw_text)
        +
Job description (job card or paste)
        ↓
POST /api/talent-intelligence/analyze
        ↓
ResumeAnalysisService (cache + persist)
        ↓
ReportGenerator — 4 parallel LLM chains
        ├── match-and-gaps-v1
        ├── resume-recruiter-v1
        ├── coaching-v1
        └── ats-keywords-v1
        ↓
ResumeIntelligenceReport (12 dashboard sections)
```

## Services

| Service | File | Role |
|---------|------|------|
| `ResumeAnalysisService` | `services/resume-analysis-service.ts` | Orchestration, caching, DB |
| `ReportGenerator` | `services/report-generator.ts` | Chains LLM prompts |
| `JobDescriptionParser` | `services/job-description-parser.ts` | Deterministic JD extraction |
| `KeywordAnalyzer` | `services/keyword-analyzer.ts` | Skill/keyword overlap |
| `ATSAnalyzer` | `services/ats-analyzer.ts` | Deterministic ATS checks |
| `LlmRunner` | `services/llm-runner.ts` | Groq JSON-mode calls |

Prompts live in `prompts/index.ts` — one dedicated prompt per chain (not a single mega-prompt).

## API

### `POST /api/talent-intelligence/analyze`

Authenticated. Uses the user's stored resume from `profiles`.

```json
{
  "jobDescription": "string (required, min 80 chars)",
  "jobTitle": "optional",
  "company": "optional",
  "jobId": "optional",
  "forceRefresh": false
}
```

Response: `{ ok, reportId, cached, report }`

### `GET /api/talent-intelligence/reports`

List analysis history.

### `GET /api/talent-intelligence/reports/[id]`

Fetch a saved report.

### `DELETE /api/talent-intelligence/reports/[id]`

Delete a report (privacy).

## Database

Migration: `supabase/migrations/20260607120000_resume_intelligence.sql`

| Table | Purpose |
|-------|---------|
| `resume_versions` | Content-hashed resume snapshots |
| `resume_intelligence_reports` | Full reports + cache_key |
| `resume_intelligence_feedback` | User ratings (future) |

RLS: owner-only on all tables.

## UI

- Dashboard tab: **Resume Intelligence** (`?view=resume-intelligence`)
- Job cards: **Analyze Resume** dialog
- Components: `components/talent-intelligence/sections/*` (12 reusable sections)

## Environment

- `GROQ_API_KEY` — required for LLM analysis
- `SUPABASE_SERVICE_ROLE_KEY` — server persistence

## Tests

```bash
npm test
```

Includes `lib/talent-intelligence/__tests__/talent-intelligence.test.ts`.

## Apply migration

```bash
supabase db push
```

Or run `20260607120000_resume_intelligence.sql` in the Supabase SQL editor.
