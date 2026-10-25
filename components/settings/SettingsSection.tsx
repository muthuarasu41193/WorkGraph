"use client";

import Link from "next/link";
import { useState } from "react";
import { useProfileTheme } from "@/components/profile/theme/ProfileThemeProvider";
import PageHero from "@/components/design-system/PageHero";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Text } from "@/components/ui/text";
import { accountDataRights } from "@/lib/account/privacy-copy";
import {
  ACCOUNT_DELETE_CONFIRMATION,
  ACCOUNT_DELETE_FAILED,
  ACCOUNT_DELETED_REDIRECT,
  ACCOUNT_EXPORT_FAILED,
  ACCOUNT_EXPORT_FILENAME,
  publicAccountError,
} from "@/lib/account/messages";
import { signOutClient } from "@/lib/auth/client";
import { activePassSentence, describePass } from "@/lib/billing/display";

export default function SettingsSection({
  subscriptionTier = null,
  subscriptionExpiresAt = null,
}: {
  subscriptionTier?: string | null;
  subscriptionExpiresAt?: string | null;
}) {
  const { resolved, toggle } = useProfileTheme();
  const pass = describePass(subscriptionTier, subscriptionExpiresAt);
  const rights = accountDataRights();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function downloadData() {
    setError(null);
    setExporting(true);
    try {
      const response = await fetch("/api/account/export", { method: "GET", credentials: "same-origin" });
      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        const message =
          payload && typeof payload === "object"
            ? (payload as { error?: unknown }).error
            : null;
        setError(publicAccountError(message, ACCOUNT_EXPORT_FAILED));
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = ACCOUNT_EXPORT_FILENAME;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(ACCOUNT_EXPORT_FAILED);
    } finally {
      setExporting(false);
    }
  }

  async function deleteAccount() {
    if (confirmation !== ACCOUNT_DELETE_CONFIRMATION) return;
    setError(null);
    setDeleting(true);
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: ACCOUNT_DELETE_CONFIRMATION }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          payload && typeof payload === "object"
            ? (payload as { error?: unknown }).error
            : null;
        setError(publicAccountError(message, ACCOUNT_DELETE_FAILED));
        return;
      }
      try {
        await signOutClient();
      } catch {
        // The login is already removed.
      }
      window.location.assign(ACCOUNT_DELETED_REDIRECT);
    } catch {
      setError(ACCOUNT_DELETE_FAILED);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Settings"
        subtitle="Dark mode is saved on this device. Other preferences on this page are not stored."
      />

      <section className="rounded-card border border-hairline bg-surface-raised p-4">
        <Text as="h2" role="subheading">WorkGraph Pass</Text>
        <Text role="body-small" className="mt-2">
          {pass.kind === "active"
            ? activePassSentence(pass.untilLabel)
            : pass.kind === "expired"
              ? `No active WorkGraph Pass. The previous pass ended ${pass.untilLabel}.`
              : pass.kind === "pro"
                ? "Pro is on this profile. It is not sold here and has no public price."
                : "No active WorkGraph Pass."}
        </Text>
        <Text role="caption" className="mt-2 text-ink-muted">
          One-time payment. Does not auto-renew. This page does not change the pass.
        </Text>
        <Link href="/pricing" className="mt-3 inline-flex min-h-11 items-center text-role-body-small text-accent">
          Pricing
        </Link>
      </section>

      <section className="rounded-card border border-hairline bg-surface-raised p-4">
        <Text as="h2" role="subheading">Appearance</Text>
        <div className="mt-3 flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="dark-mode">Dark mode</Label>
            <Text role="caption" className="text-ink-muted">Uses the theme already stored in this browser.</Text>
          </div>
          <Checkbox
            id="dark-mode"
            checked={resolved === "dark"}
            onCheckedChange={() => toggle()}
            aria-label="Dark mode"
          />
        </div>
      </section>

      <section className="rounded-card border border-hairline bg-surface-raised p-4">
        <Text as="h2" role="subheading">Notifications</Text>
        <Text role="body-small" className="mt-2 text-ink-muted">
          Job match alerts, hidden-job alerts, and application alerts are not stored. This page does not send them.
        </Text>
      </section>

      <section className="rounded-card border border-hairline bg-surface-raised p-4">
        <Text as="h2" role="subheading">Your data</Text>
        <Text role="body-small" className="mt-2 text-ink-muted">
          Download a JSON file of your account, or delete the account. {rights.backup}
        </Text>
        {error && !dialogOpen ? (
          <Alert variant="destructive" className="mt-3">
            <AlertTitle>Could not finish</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            className="min-h-11 px-4"
            loading={exporting}
            disabled={deleting}
            onClick={() => void downloadData()}
          >
            Download my data
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="min-h-11 px-4"
            disabled={exporting || deleting}
            onClick={() => {
              setError(null);
              setConfirmation("");
              setDialogOpen(true);
            }}
          >
            Delete my account
          </Button>
        </div>
        <Link href="/legal/privacy" className="mt-3 inline-flex min-h-11 items-center text-role-body-small text-accent">
          Privacy policy
        </Link>
      </section>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (deleting) return;
          setDialogOpen(open);
          if (!open) setConfirmation("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete my account</DialogTitle>
            <DialogDescription>
              This removes your login and the personal data listed here. {rights.backup}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Text role="body-small">Deleted:</Text>
            <ul className="list-disc space-y-1 pl-5 text-role-body-small">
              {rights.removed.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Text role="body-small">Unlinked from your account, and kept:</Text>
            <ul className="list-disc space-y-1 pl-5 text-role-body-small">
              {rights.unlinked.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Text role="body-small">Kept for legal reasons:</Text>
            <ul className="list-disc space-y-1 pl-5 text-role-body-small">
              {rights.kept.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Text role="caption" className="text-ink-muted">{rights.payments}</Text>
            <Text role="caption" className="text-ink-muted">{rights.consent}</Text>
            <Text role="caption" className="text-ink-muted">{rights.cascade}</Text>
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Could not delete the account</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                void deleteAccount();
              }}
            >
              <Label htmlFor="delete-account-confirmation">Type DELETE to confirm</Label>
              <Input
                id="delete-account-confirmation"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                disabled={deleting}
                name="account-delete-confirmation"
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-11"
                  disabled={deleting}
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  className="min-h-11"
                  loading={deleting}
                  disabled={confirmation !== ACCOUNT_DELETE_CONFIRMATION}
                >
                  Delete my account
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <section className="rounded-card border border-hairline bg-surface-raised p-4">
        <Text as="h2" role="subheading">Privacy</Text>
        <Text role="body-small" className="mt-2 text-ink-muted">
          Recruiter visibility is not stored. Nothing on this page shares your profile with recruiters.
        </Text>
      </section>
    </div>
  );
}
