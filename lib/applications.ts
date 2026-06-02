export const APPLICATION_STATUSES = [
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type ApplicationTimelineEvent = {
  id: string;
  type: "created" | "status_change" | "note" | "updated";
  status?: ApplicationStatus;
  label: string;
  at: string;
};

export type Application = {
  id: string;
  user_id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  applied_date: string;
  job_url: string | null;
  notes: string | null;
  salary_offered: string | null;
  contact_person: string | null;
  next_step: string | null;
  next_step_date: string | null;
  timeline: ApplicationTimelineEvent[];
  created_at: string;
  updated_at: string;
};

export type ApplicationInsert = {
  company: string;
  role: string;
  status?: ApplicationStatus;
  applied_date?: string;
  job_url?: string | null;
  notes?: string | null;
  salary_offered?: string | null;
  contact_person?: string | null;
  next_step?: string | null;
  next_step_date?: string | null;
};

export type ApplicationUpdate = Partial<
  Omit<ApplicationInsert, "company" | "role"> & {
    company: string;
    role: string;
    status: ApplicationStatus;
  }
>;

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

export const APPLICATION_COLUMNS: {
  id: ApplicationStatus;
  label: string;
  description: string;
}[] = [
  { id: "applied", label: "Applied", description: "Submitted applications" },
  { id: "screening", label: "Screening", description: "Recruiter or ATS review" },
  { id: "interview", label: "Interview", description: "Active interview loop" },
  { id: "offer", label: "Offer", description: "Offers received" },
  { id: "rejected", label: "Rejected", description: "Closed or declined" },
];

export function isApplicationStatus(value: string): value is ApplicationStatus {
  return APPLICATION_STATUSES.includes(value as ApplicationStatus);
}

export function columnDroppableId(status: ApplicationStatus): string {
  return `column:${status}`;
}

export function parseColumnDroppableId(id: string | number): ApplicationStatus | null {
  const raw = String(id);
  if (!raw.startsWith("column:")) return null;
  const status = raw.slice("column:".length);
  return isApplicationStatus(status) ? status : null;
}

export function companyLogoUrl(company: string, jobUrl?: string | null): string | null {
  try {
    if (jobUrl?.trim()) {
      const host = new URL(jobUrl).hostname.replace(/^www\./, "");
      if (host) return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
    }
  } catch {
    /* ignore invalid URLs */
  }
  const slug = company.trim().toLowerCase().replace(/\s+/g, "");
  if (!slug) return null;
  return `https://www.google.com/s2/favicons?domain=${slug}.com&sz=64`;
}

export function mapApplicationRow(row: Record<string, unknown>): Application {
  const timelineRaw = row.timeline;
  const timeline = Array.isArray(timelineRaw)
    ? (timelineRaw as ApplicationTimelineEvent[])
    : [];

  return {
    id: String(row.id),
    user_id: String(row.user_id),
    company: String(row.company ?? ""),
    role: String(row.role ?? ""),
    status: isApplicationStatus(String(row.status)) ? (row.status as ApplicationStatus) : "applied",
    applied_date: String(row.applied_date ?? "").slice(0, 10),
    job_url: typeof row.job_url === "string" ? row.job_url : null,
    notes: typeof row.notes === "string" ? row.notes : null,
    salary_offered: typeof row.salary_offered === "string" ? row.salary_offered : null,
    contact_person: typeof row.contact_person === "string" ? row.contact_person : null,
    next_step: typeof row.next_step === "string" ? row.next_step : null,
    next_step_date:
      typeof row.next_step_date === "string" ? row.next_step_date.slice(0, 10) : null,
    timeline,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

function newTimelineId(): string {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }
  return `tl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function appendTimelineEvent(
  timeline: ApplicationTimelineEvent[],
  event: Omit<ApplicationTimelineEvent, "id">,
): ApplicationTimelineEvent[] {
  return [
    {
      ...event,
      id: newTimelineId(),
    },
    ...timeline,
  ].slice(0, 50);
}

export function buildInitialTimeline(
  status: ApplicationStatus,
  appliedDate: string,
): ApplicationTimelineEvent[] {
  const at = new Date().toISOString();
  return [
    {
      id: newTimelineId(),
      type: "created",
      status,
      label: `Application created · ${APPLICATION_STATUS_LABELS[status]}`,
      at,
    },
    {
      id: newTimelineId(),
      type: "status_change",
      status,
      label: `Applied on ${appliedDate}`,
      at,
    },
  ];
}
