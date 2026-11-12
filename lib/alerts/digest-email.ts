/**
 * Alert digest email body — listing fields only.
 * Never accepts resume text, match explanations, or skills lists.
 */

import { WG_COLORS } from "@/lib/design-tokens";

/** Slim job row for digests. No resume-derived fields. */
export type DigestEmailJob = {
  title: string;
  company: string;
  location: string;
  /** Stated salary label when the posting includes one; otherwise omit. */
  statedSalary?: string | null;
  postedDate: string;
  source: string;
  jobUrl: string;
};

export type DigestEmailInput = {
  jobs: DigestEmailJob[];
  /** When true (default product posture), use the generic subject. */
  discreet: boolean;
  alertName: string;
  unsubscribeUrl: string;
  manageAlertsUrl: string;
};

export type DigestEmailContent = {
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatPostedDate(iso: string | null | undefined): string {
  if (!iso) return "Recently";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Recently";
  return d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Calcutta",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Map a match/catalog row into digest-safe fields (no skills / match % / resume). */
export function toDigestEmailJob(input: {
  title: string;
  company: string;
  location: string;
  statedSalary?: string | null;
  postedAtIso?: string | null;
  source: string;
  jobUrl: string;
}): DigestEmailJob {
  return {
    title: input.title || "Role",
    company: input.company || "Company",
    location: input.location || "Location TBD",
    statedSalary: input.statedSalary?.trim() || null,
    postedDate: formatPostedDate(input.postedAtIso),
    source: input.source || "other",
    jobUrl: input.jobUrl,
  };
}

export function buildDigestSubject(input: {
  jobCount: number;
  discreet: boolean;
  alertName: string;
}): string {
  if (input.discreet) return "Your WorkGraph update";
  const n = Math.max(0, input.jobCount);
  const name = input.alertName.trim() || "your alert";
  return `${n} new job${n === 1 ? "" : "s"} for ${name}`;
}

/**
 * Build HTML + plain-text digest. Brand red only on the WorkGraph wordmark.
 * Callers must not pass resume fields into `jobs`.
 */
export function buildAlertDigestEmail(input: DigestEmailInput): DigestEmailContent {
  const jobs = input.jobs.slice(0, 10);
  const subject = buildDigestSubject({
    jobCount: jobs.length,
    discreet: input.discreet,
    alertName: input.alertName,
  });

  const ink = WG_COLORS.textPrimary;
  const muted = WG_COLORS.textTertiary;
  const brand = WG_COLORS.primary;
  const link = WG_COLORS.textPrimary;
  const pageBg = WG_COLORS.background;
  const cardBg = WG_COLORS.surfaceRaised;
  const rule = WG_COLORS.surfaceSunken;

  const jobHtml = jobs
    .map((job) => {
      const salaryLine = job.statedSalary
        ? `<p style="margin:4px 0 0;font-size:14px;color:${muted}">${escapeHtml(job.statedSalary)}</p>`
        : "";
      return `
        <tr>
          <td style="padding:16px 0;border-bottom:1px solid ${rule}">
            <p style="margin:0;font-size:16px;font-weight:600;color:${ink}">
              <a href="${escapeHtml(job.jobUrl)}" style="color:${link};text-decoration:underline">${escapeHtml(job.title)}</a>
            </p>
            <p style="margin:6px 0 0;font-size:14px;color:${ink}">${escapeHtml(job.company)} · ${escapeHtml(job.location)}</p>
            ${salaryLine}
            <p style="margin:6px 0 0;font-size:12px;color:${muted}">Posted ${escapeHtml(job.postedDate)} · ${escapeHtml(job.source)}</p>
          </td>
        </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${pageBg};color:${ink}">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${pageBg}">
    <tr>
      <td align="center" style="padding:24px 12px">
        <table role="presentation" width="100%" style="max-width:560px;background:${cardBg};border-radius:8px;padding:24px 28px;font-family:Georgia,'Times New Roman',serif">
          <tr>
            <td>
              <p style="margin:0 0 20px;font-size:18px;font-weight:700;letter-spacing:.02em;color:${brand}">WorkGraph</p>
              <h1 style="margin:0 0 8px;font-size:20px;font-weight:600;color:${ink};font-family:system-ui,-apple-system,sans-serif">New roles for you</h1>
              <p style="margin:0 0 20px;font-size:14px;color:${muted};font-family:system-ui,-apple-system,sans-serif">
                ${jobs.length} listing${jobs.length === 1 ? "" : "s"} from your saved alerts. Open a role on WorkGraph to review details.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-family:system-ui,-apple-system,sans-serif">
                ${jobHtml}
              </table>
              <p style="margin:24px 0 8px;font-size:13px;font-family:system-ui,-apple-system,sans-serif">
                <a href="${escapeHtml(input.manageAlertsUrl)}" style="color:${link}">Manage alerts</a>
                &nbsp;·&nbsp;
                <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:${muted}">Unsubscribe</a>
              </p>
              <p style="margin:0;font-size:11px;color:${muted};font-family:system-ui,-apple-system,sans-serif">
                You received this because you saved a job alert on WorkGraph. Match scores are estimates, not hiring probabilities.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textJobs = jobs
    .map((job) => {
      const salary = job.statedSalary ? `\n  Pay: ${job.statedSalary}` : "";
      return `- ${job.title} at ${job.company} (${job.location})${salary}\n  Posted ${job.postedDate} · ${job.source}\n  ${job.jobUrl}`;
    })
    .join("\n\n");

  const text = `WorkGraph

New roles for you (${jobs.length})

${textJobs}

Manage alerts: ${input.manageAlertsUrl}
Unsubscribe: ${input.unsubscribeUrl}

Match scores are estimates, not hiring probabilities.
`;

  return { subject, html, text };
}

/** Forbidden substrings for tests — resume / match explanation leakage. */
export const DIGEST_EMAIL_FORBIDDEN_KEYS = [
  "resume_raw_text",
  "resume_url",
  "matchedSkills",
  "matchPercent",
  "skills",
  "work_experience",
  "headline",
  "summary",
] as const;
