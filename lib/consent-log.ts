import { z } from "zod";
import type { ConsentCategories } from "./consent";

const isoCountry = /^[A-Z]{2}$/;

export const consentLogBodySchema = z.object({
  anonymousId: z.string().trim().min(8).max(128),
  policyVersion: z.string().trim().min(1).max(32),
  timestamp: z.string().trim().min(10).max(40),
  categories: z.object({
    strictlyNecessary: z.literal(true),
    analytics: z.boolean(),
    marketing: z.boolean(),
  }),
});

export type ConsentLogBody = z.infer<typeof consentLogBodySchema>;

export function parseConsentLogBody(
  body: unknown,
): ConsentLogBody | { error: string } {
  const parsed = consentLogBodySchema.safeParse(body);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid consent payload" };
  }
  return parsed.data;
}

/** Country from edge headers only. Never read forwarded client IPs. */
export function ipCountryFromHeaders(headers: Headers): string | null {
  const candidates = [headers.get("x-vercel-ip-country"), headers.get("cf-ipcountry")];
  for (const value of candidates) {
    const country = value?.trim().toUpperCase() ?? "";
    if (isoCountry.test(country) && country !== "XX" && country !== "T1") {
      return country;
    }
  }
  return null;
}

export function buildConsentLogInsert(input: {
  userId: string | null;
  anonymousId: string;
  categories: ConsentCategories;
  policyVersion: string;
  ipCountry: string | null;
}): {
  user_id: string | null;
  anonymous_id: string;
  categories: ConsentCategories;
  policy_version: string;
  ip_country: string | null;
} {
  return {
    user_id: input.userId,
    anonymous_id: input.anonymousId,
    categories: input.categories,
    policy_version: input.policyVersion,
    ip_country: input.ipCountry,
  };
}
