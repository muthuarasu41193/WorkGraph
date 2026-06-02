"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  APPLICATION_COLUMNS,
  type ApplicationInsert,
  type ApplicationStatus,
} from "@/lib/applications";
import { toast } from "@/hooks/use-toast";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: ApplicationInsert) => Promise<unknown>;
};

export default function AddApplicationDialog({ open, onOpenChange, onSubmit }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("applied");
  const [appliedDate, setAppliedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [jobUrl, setJobUrl] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [nextStepDate, setNextStepDate] = useState("");
  const [notes, setNotes] = useState("");

  function resetForm() {
    setCompany("");
    setRole("");
    setStatus("applied");
    setAppliedDate(format(new Date(), "yyyy-MM-dd"));
    setJobUrl("");
    setContactPerson("");
    setNextStep("");
    setNextStepDate("");
    setNotes("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim() || !role.trim()) {
      toast({ title: "Missing fields", description: "Company and role are required.", variant: "error" });
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        company: company.trim(),
        role: role.trim(),
        status,
        applied_date: appliedDate,
        job_url: jobUrl.trim() || null,
        contact_person: contactPerson.trim() || null,
        next_step: nextStep.trim() || null,
        next_step_date: nextStepDate || null,
        notes: notes.trim() || null,
      });
      toast({ title: "Application added", description: `${company} · ${role}`, variant: "success" });
      resetForm();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Could not save",
        description: err instanceof Error ? err.message : "Try again shortly.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add application</DialogTitle>
          <DialogDescription>Track a new role in your pipeline.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="add-company">Company</Label>
              <Input
                id="add-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corp"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-role">Role</Label>
              <Input
                id="add-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Senior Engineer"
                required
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="add-status">Stage</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ApplicationStatus)}>
                <SelectTrigger id="add-status">
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
              <Label htmlFor="add-applied">Applied date</Label>
              <Input
                id="add-applied"
                type="date"
                value={appliedDate}
                onChange={(e) => setAppliedDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-url">Job URL</Label>
            <Input
              id="add-url"
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="add-contact">Contact person</Label>
              <Input
                id="add-contact"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-next">Next step</Label>
              <Input id="add-next" value={nextStep} onChange={(e) => setNextStep(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-next-date">Next step date</Label>
            <Input
              id="add-next-date"
              type="date"
              value={nextStepDate}
              onChange={(e) => setNextStepDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-notes">Notes</Label>
            <Textarea
              id="add-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Recruiter thread, prep topics, etc."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
