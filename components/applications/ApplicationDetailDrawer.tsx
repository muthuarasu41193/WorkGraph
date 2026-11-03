"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Copy, ExternalLink, Trash2 } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import { FollowUpBadge, FollowUpSuggestion } from "@/components/applications/FollowUpBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  APPLICATION_COLUMNS,
  APPLICATION_STATUS_LABELS,
  companyLogoUrl,
  type Application,
  type ApplicationStatus,
  type ApplicationUpdate,
} from "@/lib/applications";
import {
  canScheduleAnotherFollowUp,
  draftFollowUpMessage,
} from "@/lib/applications-followup";
import { toast } from "@/hooks/use-toast";

type Props = {
  application: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, patch: ApplicationUpdate) => Promise<Application>;
  onDelete: (id: string) => Promise<void>;
};

function formatTimelineAt(iso: string): string {
  try {
    return format(parseISO(iso), "MMM d, yyyy · h:mm a");
  } catch {
    return iso;
  }
}

export default function ApplicationDetailDrawer({
  application,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        {application ? (
          <DrawerBody
            key={application.id}
            application={application}
            onOpenChange={onOpenChange}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function DrawerBody({
  application,
  onOpenChange,
  onUpdate,
  onDelete,
}: {
  application: Application;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, patch: ApplicationUpdate) => Promise<Application>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState(application.notes ?? "");
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [nextStep, setNextStep] = useState(application.next_step ?? "");
  const [nextStepDate, setNextStepDate] = useState(application.next_step_date ?? "");
  const [saving, setSaving] = useState(false);
  const [draftOpen, setDraftOpen] = useState(false);
  const [markingFollowUp, setMarkingFollowUp] = useState(false);

  const draftText = useMemo(() => draftFollowUpMessage(application), [application]);
  const logo = companyLogoUrl(application.company, application.job_url);
  const canMarkFollowUp = canScheduleAnotherFollowUp(application.timeline);

  async function saveDetails() {
    setSaving(true);
    try {
      await onUpdate(application.id, {
        notes,
        status,
        next_step: nextStep.trim() || null,
        next_step_date: nextStepDate || null,
      });
      toast({ title: "Saved", description: "Application details updated.", variant: "success" });
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete ${application.company} · ${application.role}?`)) return;
    try {
      await onDelete(application.id);
      toast({ title: "Deleted", description: "Application removed from tracker." });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "error",
      });
    }
  }

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(draftText);
      toast({ title: "Copied", description: "Follow-up draft copied to clipboard.", variant: "success" });
    } catch {
      toast({ title: "Copy failed", description: "Select the text and copy manually.", variant: "error" });
    }
  }

  async function markFollowedUp() {
    setMarkingFollowUp(true);
    try {
      const updated = await onUpdate(application.id, { mark_followed_up: true });
      setNextStep(updated.next_step ?? "");
      setNextStepDate(updated.next_step_date ?? "");
      toast({
        title: "Follow-up recorded",
        description: updated.next_step_date
          ? `Next nudge set for ${updated.next_step_date}.`
          : "Two follow-ups recorded — nudges stopped for this card.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Could not mark followed up",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "error",
      });
    } finally {
      setMarkingFollowUp(false);
    }
  }

  return (
    <>
      <SheetHeader className="border-b border-border pb-4">
        <div className="flex items-start gap-3 pr-8">
          <Avatar className="h-12 w-12 rounded-lg">
            {logo ? <AvatarImage src={logo} alt="" /> : null}
            <AvatarFallback className="rounded-lg bg-[var(--dash-accent-soft)] font-semibold text-[var(--dash-accent)]">
              {application.company.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <SheetTitle className="text-left leading-snug">{application.role}</SheetTitle>
            <SheetDescription className="text-left">{application.company}</SheetDescription>
            <p className="mt-1 text-xs text-muted-foreground">
              {APPLICATION_STATUS_LABELS[application.status]} · Applied {application.applied_date}
            </p>
            <FollowUpBadge application={application} />
            <FollowUpSuggestion application={application} className="mt-1 text-left" />
          </div>
        </div>
        {application.job_url ? (
          <Button asChild variant="outline" size="sm" className="mt-2 w-fit">
            <a href={application.job_url} target="_blank" rel="noopener noreferrer">
              View posting
              <ExternalLink className={iconClass()} />
            </a>
          </Button>
        ) : null}
      </SheetHeader>

      <div className="space-y-6 p-4">
        <section className="space-y-3" aria-labelledby="drawer-fields-heading">
          <h2 id="drawer-fields-heading" className="text-sm font-semibold">
            Details
          </h2>
          <div className="space-y-2">
            <Label htmlFor="drawer-status">Stage</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ApplicationStatus)}>
              <SelectTrigger id="drawer-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPLICATION_COLUMNS.map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="drawer-next">Next step</Label>
            <Input id="drawer-next" value={nextStep} onChange={(e) => setNextStep(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="drawer-next-date">Next step date</Label>
            <Input
              id="drawer-next-date"
              type="date"
              value={nextStepDate}
              onChange={(e) => setNextStepDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="drawer-notes">Notes</Label>
            <Textarea
              id="drawer-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
            />
          </div>
          <Button type="button" onClick={() => void saveDetails()} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </section>

        <section className="space-y-3" aria-labelledby="drawer-followup-heading">
          <h2 id="drawer-followup-heading" className="text-sm font-semibold">
            Follow-up
          </h2>
          <p className="text-xs text-muted-foreground">
            Drafts are a short template — not AI. Nothing moves stages automatically.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setDraftOpen((value) => !value)}>
              Draft follow-up
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={markingFollowUp || !canMarkFollowUp}
              onClick={() => void markFollowedUp()}
            >
              {markingFollowUp ? "Saving…" : "Mark followed up"}
            </Button>
          </div>
          {draftOpen ? (
            <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
              <Textarea readOnly value={draftText} rows={6} className="resize-none bg-background" />
              <Button type="button" variant="outline" size="sm" onClick={() => void copyDraft()}>
                <Copy className={iconClass()} />
                Copy
              </Button>
            </div>
          ) : null}
        </section>

        <section className="space-y-3" aria-labelledby="drawer-meta-heading">
          <h2 id="drawer-meta-heading" className="text-sm font-semibold">
            Application info
          </h2>
          <dl className="grid gap-2 text-sm">
            {application.contact_person ? (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Contact</dt>
                <dd className="font-medium">{application.contact_person}</dd>
              </div>
            ) : null}
            {application.salary_offered ? (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Salary offered</dt>
                <dd className="font-medium">{application.salary_offered}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Last updated</dt>
              <dd className="tabular-nums">{formatTimelineAt(application.updated_at)}</dd>
            </div>
          </dl>
        </section>

        <section className="space-y-3" aria-labelledby="drawer-timeline-heading">
          <h2 id="drawer-timeline-heading" className="text-sm font-semibold">
            Timeline
          </h2>
          {application.timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No timeline events yet.</p>
          ) : (
            <ol className="relative space-y-4 border-l border-border pl-4">
              {application.timeline.map((event) => (
                <li key={event.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--dash-accent)]" />
                  <p className="text-sm font-medium">{event.label}</p>
                  <p className="text-xs text-muted-foreground">{formatTimelineAt(event.at)}</p>
                </li>
              ))}
            </ol>
          )}
        </section>

        <Button type="button" variant="destructive" className="w-full" onClick={() => void handleDelete()}>
          <Trash2 className={iconClass()} />
          Delete application
        </Button>
      </div>
    </>
  );
}
