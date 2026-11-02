export {
  buildSourceLines,
  formatSourceLinesForPrompt,
  sourceLineMap,
  TAILORING_JOB_CHAR_CAP,
  TAILORING_RESUME_CHAR_CAP,
  truncateJobText,
  type SourceDocument,
  type SourceLine,
} from "./source";

export {
  buildTailoringUserPrompt,
  TAILORING_PROMPT_ID,
  TAILORING_SYSTEM_PROMPT,
} from "./prompt";

export {
  extractCapitalisedTokens,
  extractNumberCores,
  parseTailoringModelJson,
  reasonSuggestionFails,
  rawTailoringResponseSchema,
  tryParseTailoringModelJson,
  verifyTailoringResponse,
  type VerifiedSuggestion,
  type VerifiedTailoringResult,
} from "./verify";

export { runEvidenceTailoring, type RunTailoringParams, type TailoringRunResult } from "./service";

export { handleTailoringRequest, loadTailoringJob, loadTailoringResume } from "./handle";
