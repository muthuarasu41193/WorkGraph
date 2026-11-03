import { z } from "zod";

import { PASS_PLAN_IDS } from "@/lib/billing/plans";

const experienceIdSchema = z.string().uuid();

/** Pass order: `{ kind: "pass", planId }` or legacy `{ planId }`. Extra keys (e.g. amount) are ignored. */
const passOrderBodySchema = z.object({
  kind: z.literal("pass").optional(),
  planId: z.enum(PASS_PLAN_IDS),
});

const vaultOrderBodySchema = z.object({
  kind: z.literal("vault"),
  experienceId: experienceIdSchema,
});

export const razorpayOrderBodySchema = z.union([passOrderBodySchema, vaultOrderBodySchema]);

export const razorpayVerifyBodySchema = z.object({
  razorpay_order_id: z.string().trim().min(1).max(64),
  razorpay_payment_id: z.string().trim().min(1).max(64),
  razorpay_signature: z.string().trim().min(1).max(256),
});

export type RazorpayOrderBody = z.infer<typeof razorpayOrderBodySchema>;
export type RazorpayVerifyBody = z.infer<typeof razorpayVerifyBodySchema>;

export function isVaultOrderBody(
  body: RazorpayOrderBody,
): body is z.infer<typeof vaultOrderBodySchema> {
  return "kind" in body && body.kind === "vault";
}
