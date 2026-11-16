/**
 * Transactional email via Resend HTTP API (no extra dependency).
 * Set RESEND_API_KEY and WORKGRAPH_EMAIL_FROM in the environment.
 */

import { WG_COLORS } from "@/lib/design-tokens";
import { getSiteUrl } from "@/lib/site-url";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendEmailResult = { ok: true } | { ok: false; error: string };

function appBaseUrl(): string {
  const vercel =
    process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL?.trim()
      ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`
      : "";
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    vercel ||
    getSiteUrl()
  ).replace(/\/$/, "");
}

export function getAppBaseUrl(): string {
  return appBaseUrl();
}

export async function sendWorkgraphEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const from =
    process.env.WORKGRAPH_EMAIL_FROM?.trim() || "WorkGraph <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: body || `Resend HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Send failed" };
  }
}

export function buildConnectionNotifyEmployerEmail(params: {
  employerEmail: string;
  companyName: string;
  signalTitle: string;
  seekerName: string;
  matchPercent: number;
  connectionNote: string;
  inboxUrl: string;
}): SendEmailInput {
  const preview = params.connectionNote
    ? params.connectionNote.slice(0, 280) + (params.connectionNote.length > 280 ? "…" : "")
    : "(No note)";

  const html = `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:520px;color:${WG_COLORS.textPrimary}">
      <p style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:${WG_COLORS.primary}">WorkGraph Direct</p>
      <h1 style="font-size:20px;margin:0 0 12px">New connection on <em>${escapeHtml(params.signalTitle)}</em></h1>
      <p><strong>${escapeHtml(params.seekerName)}</strong> connected with <strong>${params.matchPercent}%</strong> fit alignment.</p>
      <blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid ${WG_COLORS.primary};background:${WG_COLORS.surfaceHover}">${escapeHtml(preview)}</blockquote>
      <p><a href="${params.inboxUrl}" style="display:inline-block;background:${WG_COLORS.primary};color:${WG_COLORS.accentInk};padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Open Pulse inbox</a></p>
      <p style="font-size:12px;color:${WG_COLORS.textTertiary};margin-top:24px">${escapeHtml(params.companyName)} · WorkGraph hiring signals</p>
    </div>
  `;

  return {
    to: params.employerEmail,
    subject: `New connection: ${params.seekerName} → ${params.signalTitle}`,
    html,
    text: `${params.seekerName} connected (${params.matchPercent}% fit) to ${params.signalTitle}.\n\n${preview}\n\nInbox: ${params.inboxUrl}`,
  };
}

export function buildStageUpdateSeekerEmail(params: {
  seekerEmail: string;
  companyName: string;
  signalTitle: string;
  stageLabel: string;
  employerReply?: string | null;
  directUrl: string;
}): SendEmailInput {
  const replyBlock = params.employerReply
    ? `<p style="margin-top:12px"><strong>From employer:</strong> ${escapeHtml(params.employerReply)}</p>`
    : "";

  const html = `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:520px;color:${WG_COLORS.textPrimary}">
      <p style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:${WG_COLORS.primary}">WorkGraph Direct</p>
      <h1 style="font-size:20px;margin:0 0 12px">Update on your connection</h1>
      <p><strong>${escapeHtml(params.companyName)}</strong> moved your connection to <strong>${escapeHtml(params.stageLabel)}</strong> for <em>${escapeHtml(params.signalTitle)}</em>.</p>
      ${replyBlock}
      <p><a href="${params.directUrl}" style="display:inline-block;background:${WG_COLORS.primary};color:${WG_COLORS.accentInk};padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">View in WorkGraph Direct</a></p>
    </div>
  `;

  return {
    to: params.seekerEmail,
    subject: `${params.companyName}: ${params.stageLabel} — ${params.signalTitle}`,
    html,
    text: `${params.companyName} updated your connection to ${params.stageLabel} for ${params.signalTitle}.${params.employerReply ? `\n\n${params.employerReply}` : ""}\n\n${params.directUrl}`,
  };
}

/**
 * One-time company-email confirmation for Interview Vault contributors.
 * Callers must not log `code` or `to`.
 */
export function buildCompanyEmailConfirmationEmail(params: {
  to: string;
  code: string;
  expiresInMinutes: number;
}): SendEmailInput {
  const minutes = Math.max(1, Math.floor(params.expiresInMinutes));
  const html = `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:520px;color:${WG_COLORS.textPrimary}">
      <p style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:${WG_COLORS.primary}">WorkGraph Interview Vault</p>
      <h1 style="font-size:20px;margin:0 0 12px">Confirm your work email</h1>
      <p>Use this one-time code in your contributor dashboard. It expires in ${minutes} minutes.</p>
      <p style="font-size:28px;letter-spacing:.24em;font-weight:700;margin:20px 0">${escapeHtml(params.code)}</p>
      <p style="font-size:12px;color:${WG_COLORS.textTertiary}">If you did not request this, you can ignore this message. WorkGraph never asks for your work email password.</p>
    </div>
  `;

  return {
    to: params.to,
    subject: "Your WorkGraph work-email confirmation code",
    html,
    text: `Your WorkGraph confirmation code is ${params.code}. It expires in ${minutes} minutes. If you did not request this, ignore this message.`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
