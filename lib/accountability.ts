/** Shared copy and placeholders for accountability pages. Mark founder-supplied facts as TODO. */

export const ACCOUNTABILITY_LAST_REVIEWED = "5 November 2026"

export const CONTACT_MONITORED_EMAIL = "hello@getworkgraph.com"
/** Honest reply promise shown on Contact. Update when staffing changes. */
export const CONTACT_REPLY_PROMISE =
  "A person reads every message. We aim to reply within two business days."

export const APPLY_SAFETY_NOTICE = "WorkGraph never asks for payment or ID numbers."

export const FOUNDER = {
  /** TODO: replace with the founder’s legal or preferred public name. */
  name: "TODO: founder name",
  /** TODO: replace public/about/founder.svg with a real portrait (jpg/webp) and update this path. */
  photoSrc: "/about/founder.svg",
  photoAlt: "TODO: photo of the WorkGraph founder",
  /** TODO: rewrite in the founder’s own words. Keep it specific and non-performative. */
  story: [
    "TODO: honest origin story — why WorkGraph exists, what problem you hit while job searching, and what the product does not claim to fix.",
    "TODO: one concrete sentence about what you personally check in the job index today.",
  ],
  /** TODO: replace with how the product is actually funded (bootstrapped, revenue, grant, etc.). */
  funding:
    "TODO: how WorkGraph is funded today. Say what pays for hosting and ingest. Do not invent investors, revenue figures, or runway.",
} as const

export const LISTING_REPORT_REASONS = [
  { id: "scam_payment", label: "Asks for payment or personal ID to apply" },
  { id: "scam_offplatform", label: "Only off-platform contact (WhatsApp, Telegram, personal email)" },
  { id: "closed", label: "Role looks closed or already filled" },
  { id: "wrong_company", label: "Company or role looks wrong" },
  { id: "duplicate", label: "Duplicate of another listing" },
  { id: "other", label: "Something else" },
] as const

export type ListingReportReasonId = (typeof LISTING_REPORT_REASONS)[number]["id"]

export const LISTING_REPORT_CONFIRMATION =
  "Thanks. A person will review this listing. Suspected scams are removed from the index when we can confirm the report. We may not reply to every report."

/** Real ingest sources we are willing to name on the accountability page. */
export const NAMED_INGEST_SOURCES = [
  { id: "greenhouse", label: "Greenhouse boards", how: "Public board JSON when a company board URL is configured." },
  { id: "lever", label: "Lever boards", how: "Public postings API for configured company sites." },
  { id: "ashby", label: "Ashby boards", how: "Public job board feed for configured companies." },
  { id: "workday", label: "Workday career sites", how: "Listed openings pulled from configured Workday hosts." },
  { id: "smartrecruiters", label: "SmartRecruiters", how: "Public SmartRecruiters company feeds when configured." },
  { id: "usajobs", label: "USAJobs", how: "U.S. federal openings via the public USAJobs API." },
  { id: "adzuna", label: "Adzuna", how: "Vendor jobs API. We do not send resume files to Adzuna." },
  { id: "remoteok", label: "RemoteOK", how: "Public remote listings feed." },
] as const

export const SCAM_REMOVAL_STEPS = [
  "Text rules flag payment requests, always-open wording, missing company names, and off-platform-only contact.",
  "Anyone can use Report this listing. Reports are stored and reviewed by a person.",
  "When a report matches a clear scam pattern, we remove or hide the listing from the public index.",
  "We do not claim every scam is caught. A missing flag is not a guarantee the role is safe.",
] as const

export const PRIVACY_SUMMARY_POINTS = [
  "We store the account details you submit, resume text you upload, and applications you log.",
  "Match scores and resume extracts are estimates produced by models. They are not hiring decisions.",
  "We do not sell your resume. Subprocessors that touch product data are listed in the full policy.",
  "You can ask to export or delete your major personal data. Privacy requests go to privacy@getworkgraph.com.",
] as const
