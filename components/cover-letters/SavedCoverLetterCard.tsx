"use client";

import { useState } from "react";
import { Copy, Trash2 } from "lucide-react";
import { apiErrorMessage, readApiJson, withSupabaseAuthHeaders } from "@/lib/api-fetch";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type SavedCoverLetterCardProps = {
  id: string;
  jobTitle: string;
  company: string;
  createdAt: string;
  onDelete: (id: string) => void;
};

export default function SavedCoverLetterCard({
  id,
  jobTitle,
  company,
  createdAt,
  onDelete,
}: SavedCoverLetterCardProps) {
  const [letter, setLetter] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loadingLetter, setLoadingLetter] = useState(false);
  const [copying, setCopying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateLabel = (() => {
    const parsed = new Date(createdAt);
    return Number.isNaN(parsed.getTime()) ? createdAt : parsed.toLocaleDateString();
  })();

  async function loadLetter(): Promise<string | null> {
    if (letter) return letter;
    setLoadingLetter(true);
    setError(null);
    try {
      const headers = await withSupabaseAuthHeaders();
      const res = await fetch(`/api/cover-letters/${id}`, { headers });
      const data = (await readApiJson(res)) as { letter?: string };
      if (!res.ok || typeof data.letter !== "string" || !data.letter.trim()) {
        setError(apiErrorMessage(data) ?? "Could not load this cover letter.");
        return null;
      }
      setLetter(data.letter);
      return data.letter;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this cover letter.");
      return null;
    } finally {
      setLoadingLetter(false);
    }
  }

  async function handleView() {
    setViewOpen(true);
    await loadLetter();
  }

  async function handleCopy() {
    setCopying(true);
    setError(null);
    try {
      const text = await loadLetter();
      if (!text) return;
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied cover letter", variant: "success" });
    } catch {
      toast({
        title: "Copy failed",
        description: "Clipboard permission was blocked. Open the letter and copy it manually.",
        variant: "error",
      });
    } finally {
      setCopying(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const headers = await withSupabaseAuthHeaders();
      const res = await fetch(`/api/cover-letters/${id}`, { method: "DELETE", headers });
      const data = await readApiJson(res);
      if (!res.ok) {
        setError(apiErrorMessage(data) ?? "Could not delete this cover letter.");
        return;
      }
      setConfirmOpen(false);
      toast({ title: "Cover letter deleted", variant: "success" });
      onDelete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete this cover letter.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Card className="wg-dash-section-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{jobTitle}</CardTitle>
          <CardDescription>
            {company} · {dateLabel}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => void handleView()} disabled={loadingLetter}>
              View Full Letter
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void handleCopy()} loading={copying}>
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{jobTitle}</DialogTitle>
            <DialogDescription>
              {company} · {dateLabel}
            </DialogDescription>
          </DialogHeader>
          {loadingLetter && !letter ? (
            <p className="text-sm text-muted-foreground">Loading letter…</p>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-6">{letter}</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => void handleCopy()} loading={copying}>
              Copy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this cover letter?</DialogTitle>
            <DialogDescription>
              This removes the saved letter for {jobTitle} at {company}. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={() => void handleDelete()} loading={deleting}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
