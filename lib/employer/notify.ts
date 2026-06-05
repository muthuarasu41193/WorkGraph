import {
  buildConnectionNotifyEmployerEmail,
  buildStageUpdateSeekerEmail,
  getAppBaseUrl,
  sendWorkgraphEmail,
} from "@/lib/email/workgraph-mail";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { CONNECTION_STAGE_LABELS, type ConnectionStage } from "./types";

async function getUserEmail(userId: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user?.email) {
    const { data: profile } = await admin
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .maybeSingle();
    const email = (profile as { email?: string } | null)?.email;
    return email?.trim() || null;
  }
  return data.user.email;
}

export async function notifyEmployerOfConnection(params: {
  employerId: string;
  companyName: string;
  signalTitle: string;
  seekerId: string;
  seekerName: string;
  matchPercent: number;
  connectionNote: string;
  signalId: string;
}): Promise<void> {
  const email = await getUserEmail(params.employerId);
  if (!email) return;

  const base = getAppBaseUrl();
  const payload = buildConnectionNotifyEmployerEmail({
    employerEmail: email,
    companyName: params.companyName,
    signalTitle: params.signalTitle,
    seekerName: params.seekerName,
    matchPercent: params.matchPercent,
    connectionNote: params.connectionNote,
    inboxUrl: `${base}/employer/signals/${params.signalId}`,
  });

  const result = await sendWorkgraphEmail(payload);
  if (!result.ok) {
    console.warn("[workgraph-mail] employer connection notify:", result.error);
  }
}

export async function notifySeekerOfStageUpdate(params: {
  seekerId: string;
  companyName: string;
  signalTitle: string;
  stage: ConnectionStage;
  employerReply?: string | null;
}): Promise<void> {
  const email = await getUserEmail(params.seekerId);
  if (!email) return;

  const base = getAppBaseUrl();
  const payload = buildStageUpdateSeekerEmail({
    seekerEmail: email,
    companyName: params.companyName,
    signalTitle: params.signalTitle,
    stageLabel: CONNECTION_STAGE_LABELS[params.stage],
    employerReply: params.employerReply,
    directUrl: `${base}/profile?view=workgraph-direct`,
  });

  const result = await sendWorkgraphEmail(payload);
  if (!result.ok) {
    console.warn("[workgraph-mail] seeker stage notify:", result.error);
  }
}
