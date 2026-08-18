import type { ZodError, ZodIssue } from "zod";

export type FieldError = {
  field: string;
  message: string;
};

export class ValidationError extends Error {
  readonly status = 400;
  readonly details: FieldError[];

  constructor(message: string, details: FieldError[] = []) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}

function humanizeIssue(issue: ZodIssue): string {
  if (issue.message && !/^Required$/i.test(issue.message) && !issue.message.startsWith("Invalid")) {
    return issue.message;
  }
  switch (issue.code) {
    case "invalid_type":
      return "This value is not valid.";
    case "too_small":
      return "This value is too short.";
    case "too_big":
      return "This value is too long.";
    case "invalid_string":
      return "This value is not in the expected format.";
    case "invalid_enum_value":
      return "This value is not an allowed option.";
    default:
      return issue.message || "This value is not valid.";
  }
}

export function fieldErrorsFromZod(error: ZodError): FieldError[] {
  const seen = new Set<string>();
  const details: FieldError[] = [];
  for (const issue of error.issues) {
    const field = issue.path.length ? issue.path.map(String).join(".") : "body";
    const message = humanizeIssue(issue);
    const key = `${field}:${message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    details.push({ field, message });
  }
  return details;
}

export function validationErrorFromZod(error: ZodError): ValidationError {
  const details = fieldErrorsFromZod(error);
  const message = details[0]?.message ?? "Please fix the highlighted fields.";
  return new ValidationError(message, details);
}

const INTERNAL_ERROR_RE =
  /postgres|pgrst|postgrest|\bsqlstate\b|violates unique|duplicate key|row-level security|permission denied for|service.?role|stack:|\bat\s+\S+\s+\(|ECONNREFUSED|ENOENT|ECONNRESET|ETIMEDOUT|ENOTFOUND|api[_-]?key|secret key|missing required environment/i;

export function looksLikeInternalError(message: string): boolean {
  return INTERNAL_ERROR_RE.test(message);
}

/** Safe message for 5xx responses. Never returns stack traces or database text. */
export function publicInternalMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof ValidationError) return error.message;
  void error;
  return fallback;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}
