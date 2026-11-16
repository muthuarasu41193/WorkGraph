/** Allowed product funnel event names (must match the product_events check constraint). */
export const PRODUCT_EVENT_NAMES = [
  "signup",
  "resume_uploaded",
  "match_viewed",
  "tailoring_run",
  "cover_letter",
  "pass_checkout_started",
  "pass_purchased",
  "vault_purchased",
  "digest_sent",
  "digest_unsubscribed",
  "application_added",
  "follow_up_marked",
  "vault_report_submitted",
  "vault_refund_requested",
  "vault_review_reported",
  // Milestone D validation funnel (IDs/categories only — never JD/resume/PII)
  "prep_pack_started",
  "prep_pack_completed",
  "vault_guide_clicked",
  "vault_return_visit",
  "vault_guide_freshness",
  "vault_contributor_earnings",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number];

export const PRODUCT_EVENT_NAME_SET = new Set<string>(PRODUCT_EVENT_NAMES);

/** Prop keys that look like PII or large free text — always rejected. */
export const BLOCKED_PROP_KEYS = new Set([
  "email",
  "emails",
  "name",
  "full_name",
  "first_name",
  "last_name",
  "phone",
  "phone_number",
  "address",
  "resume",
  "resume_text",
  "resume_raw_text",
  "job_description",
  "jd",
  "password",
  "token",
  "secret",
  "letter",
  "content",
  "notes",
  "contact",
  "contact_person",
]);
