"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { ExternalLink, Trash2 } from "lucide-react";
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
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("applied");
  const [nextStep, setNextStep] = useState("");
  const [nextStepDate, setNextStepDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!application) return;
    setNotes(application.notes ?? "");
    setStatus(application.status);
    setNextStep(application.next_step ?? "");
    setNextStepDate(application.next_step_date ?? "");
  }, [application]);

  if (!application) return null;

  const logo = companyLogoUrl(application.company, application.job_url);

  async function saveDetails() {
    setSaving(true);
    try {
      await onUpdate(application!.id, {
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
    const app = application;
    if (!app) return;
    if (!confirm(`Delete ${app.company} · ${app.role}?`)) return;
    try {
      await onDelete(app.id);
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-start gap-3 pr-8">
            <Avatar className="h-12 w-12 rounded-lg">
              {logo ? <AvatarImage src={logo} alt="" /> : null}
              <AvatarFallback className="rounded-lg bg-[var(--accent-subtle)] font-semibold text-[var(--accent)]">
                {application.company.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <SheetTitle className="text-left leading-snug">{application.role}</SheetTitle>
              <SheetDescription className="text-left">{application.company}</SheetDescription>
              <p className="mt-1 text-caption text-muted-foreground">
                {APPLICATION_STATUS_LABELS[application.status]} · Applied{" "}
                {application.applied_date}
              </p>
            </div>
          </div>
          {application.job_url ? (
            <Button asChild variant="outline" size="sm" className="mt-2 w-fit">
              <a href={application.job_url} target="_blank" rel="noopener noreferrer">
                View posting
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          ) : null}
        </SheetHeader>

        <div className="space-y-6 p-4">
          <section className="space-y-3" aria-labelledby="drawer-fields-heading">
            <h2 id="drawer-fields-heading" className="text-body font-semibold">
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

          <section className="space-y-3" aria-labelledby="drawer-meta-heading">
            <h2 id="drawer-meta-heading" className="text-body font-semibold">
              Application info
            </h2>
            <dl className="grid gap-2 text-body">
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
            <h2 id="drawer-timeline-heading" className="text-body font-semibold">
              Timeline
            </h2>
            {application.timeline.length === 0 ? (
              <p className="text-body text-muted-foreground">No timeline events yet.</p>
            ) : (
              <ol className="relative space-y-4 border-l border-border pl-4">
                {application.timeline.map((event) => (
                  <li key={event.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                    <p className="text-body font-medium">{event.label}</p>
                    <p className="text-caption text-muted-foreground">{formatTimelineAt(event.at)}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <Button type="button" variant="destructive" className="w-full" onClick={() => void handleDelete()}>
            <Trash2 className="h-4 w-4" />
            Delete application
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
