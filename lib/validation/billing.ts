import { z } from "zod";

import { PASS_PLAN_IDS } from "@/lib/billing/plans";

export const razorpayOrderBodySchema = z.object({
  planId: z.enum(PASS_PLAN_IDS),
});

export const razorpayVerifyBodySchema = z.object({
  razorpay_order_id: z.string().trim().min(1).max(64),
  razorpay_payment_id: z.string().trim().min(1).max(64),
  razorpay_signature: z.string().trim().min(1).max(256),
});

export type RazorpayOrderBody = z.infer<typeof razorpayOrderBodySchema>;
export type RazorpayVerifyBody = z.infer<typeof razorpayVerifyBodySchema>;
