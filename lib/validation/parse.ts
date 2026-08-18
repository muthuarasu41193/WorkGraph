import type { ZodSchema } from "zod";

import { ValidationError, validationErrorFromZod } from "./errors";

export function parseWithSchema<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw validationErrorFromZod(result.error);
  }
  return result.data;
}

export function safeParseWithSchema<T>(
  schema: ZodSchema<T>,
  data: unknown,
): { ok: true; data: T } | { ok: false; error: ValidationError } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return { ok: false, error: validationErrorFromZod(result.error) };
  }
  return { ok: true, data: result.data };
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON.");
  }
}

export async function parseJsonBody<T>(request: Request, schema: ZodSchema<T>): Promise<T> {
  const body = await readJsonBody(request);
  return parseWithSchema(schema, body);
}
