import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth/session-server";
import {
  appendTimelineEvent,
  APPLICATION_STATUS_LABELS,
  buildInitialTimeline,
  isApplicationStatus,
  mapApplicationRow,
  type Application,
  type ApplicationInsert,
  type ApplicationStatus,
  type ApplicationTimelineEvent,
  type ApplicationUpdate,
} from "@/lib/applications";
import { createServerSupabaseClient } from "@/lib/supabase";
import { supabaseConfigured } from "@/lib/supabase-enabled";

export class ApplicationsApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new ApplicationsApiError("Unauthorized", 401);
  if (!supabaseConfigured()) {
    throw new ApplicationsApiError("Supabase is not configured", 503);
  }
  const supabase = createServerSupabaseClient(await cookies());
  return { user, supabase };
}

export async function listApplicationsForUser(): Promise<Application[]> {
  const { user, supabase } = await requireUser();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) throw new ApplicationsApiError(error.message, 500);
  return (data ?? []).map((row) => mapApplicationRow(row as Record<string, unknown>));
}

export async function createApplicationForUser(input: ApplicationInsert): Promise<Application> {
  const { user, supabase } = await requireUser();

  const company = input.company?.trim();
  const role = input.role?.trim();
  if (!company || !role) {
    throw new ApplicationsApiError("Company and role are required", 400);
  }

  const status: ApplicationStatus = input.status && isApplicationStatus(input.status) ? input.status : "applied";
  const applied_date = input.applied_date ?? new Date().toISOString().slice(0, 10);
  const timeline = buildInitialTimeline(status, applied_date);

  const { data, error } = await supabase
    .from("applications")
    .insert({
      user_id: user.id,
      company,
      role,
      status,
      applied_date,
      job_url: input.job_url?.trim() || null,
      notes: input.notes?.trim() || null,
      salary_offered: input.salary_offered?.trim() || null,
      contact_person: input.contact_person?.trim() || null,
      next_step: input.next_step?.trim() || null,
      next_step_date: input.next_step_date || null,
      timeline,
    })
    .select("*")
    .single();

  if (error) throw new ApplicationsApiError(error.message, 500);
  return mapApplicationRow(data as Record<string, unknown>);
}

export async function updateApplicationForUser(
  id: string,
  patch: ApplicationUpdate,
): Promise<Application> {
  const { user, supabase } = await requireUser();

  const { data: existing, error: fetchError } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError) throw new ApplicationsApiError(fetchError.message, 500);
  if (!existing) throw new ApplicationsApiError("Application not found", 404);

  const current = mapApplicationRow(existing as Record<string, unknown>);
  let timeline: ApplicationTimelineEvent[] = current.timeline;

  const updates: Record<string, unknown> = {};

  if (patch.company !== undefined) updates.company = patch.company.trim();
  if (patch.role !== undefined) updates.role = patch.role.trim();
  if (patch.applied_date !== undefined) updates.applied_date = patch.applied_date;
  if (patch.job_url !== undefined) updates.job_url = patch.job_url?.trim() || null;
  if (patch.notes !== undefined) updates.notes = patch.notes?.trim() || null;
  if (patch.salary_offered !== undefined) updates.salary_offered = patch.salary_offered?.trim() || null;
  if (patch.contact_person !== undefined) updates.contact_person = patch.contact_person?.trim() || null;
  if (patch.next_step !== undefined) updates.next_step = patch.next_step?.trim() || null;
  if (patch.next_step_date !== undefined) updates.next_step_date = patch.next_step_date || null;

  if (patch.status !== undefined) {
    if (!isApplicationStatus(patch.status)) {
      throw new ApplicationsApiError("Invalid status", 400);
    }
    updates.status = patch.status;
    if (patch.status !== current.status) {
      timeline = appendTimelineEvent(timeline, {
        type: "status_change",
        status: patch.status,
        label: `Moved to ${APPLICATION_STATUS_LABELS[patch.status]}`,
        at: new Date().toISOString(),
      });
      updates.timeline = timeline;
    }
  }

  if (patch.notes !== undefined && patch.notes?.trim() && patch.notes.trim() !== current.notes) {
    timeline = appendTimelineEvent(timeline, {
      type: "note",
      label: "Notes updated",
      at: new Date().toISOString(),
    });
    updates.timeline = timeline;
  }

  const { data, error } = await supabase
    .from("applications")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) throw new ApplicationsApiError(error.message, 500);
  return mapApplicationRow(data as Record<string, unknown>);
}

export async function deleteApplicationForUser(id: string): Promise<void> {
  const { user, supabase } = await requireUser();
  const { error } = await supabase.from("applications").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new ApplicationsApiError(error.message, 500);
}
