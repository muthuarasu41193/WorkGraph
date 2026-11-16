"use client";

import { useId, useRef, useState } from "react";

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
import { prepPackMessages } from "@/lib/prep-pack/messages";

export type ShareDialogPayload = {
  id: string;
  urlPath: string;
  token: string;
  expiresAt: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packLabel?: string | null;
  share: ShareDialogPayload | null;
  status: "idle" | "loading" | "ready" | "error" | "revoking" | "revoked";
  error: string | null;
  onRevoke: () => void | Promise<void>;
  onRetry?: () => void | Promise<void>;
};

export default function SharePrepPackDialog({
  open,
  onOpenChange,
  packLabel,
  share,
  status,
  error,
  onRevoke,
  onRetry,
}: Props) {
  const m = prepPackMessages;
  const titleId = useId();
  const statusId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const absoluteUrl =
    share && typeof window !== "undefined"
      ? `${window.location.origin}${share.urlPath}`
      : share?.urlPath ?? "";

  const liveMessage =
    status === "loading"
      ? m.shareCreating
      : status === "ready"
        ? m.shareReady
        : status === "error"
          ? error || m.shareCreateFailed
          : status === "revoking"
            ? m.shareRevoking
            : status === "revoked"
              ? m.shareRevoked
              : "";

  async function copyLink() {
    if (!absoluteUrl) return;
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
    } catch {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setCopied(false);
        onOpenChange(next);
      }}
    >
      <DialogContent
        aria-labelledby={titleId}
        aria-describedby={statusId}
        className="md:max-w-md"
        onOpenAutoFocus={(event) => {
          if (status === "ready" && inputRef.current) {
            event.preventDefault();
            inputRef.current.focus();
            inputRef.current.select();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle id={titleId}>{m.shareTitle}</DialogTitle>
          <DialogDescription>
            {packLabel ? m.shareBodyWithRole.replace("{role}", packLabel) : m.shareBody}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3" aria-live="polite" aria-atomic="true">
          <p id={statusId} className="sr-only">
            {liveMessage}
          </p>

          {status === "loading" ? (
            <p className="text-role-body text-fg-secondary">{m.shareCreating}</p>
          ) : null}

          {status === "error" ? (
            <p className="text-role-body text-danger" role="alert">
              {error || m.shareCreateFailed}
            </p>
          ) : null}

          {status === "ready" && share ? (
            <div className="space-y-2">
              <label htmlFor="prep-pack-share-url" className="text-role-caption text-fg-secondary">
                {m.shareLinkLabel}
              </label>
              <Input
                id="prep-pack-share-url"
                ref={inputRef}
                readOnly
                value={absoluteUrl}
                className="min-h-11 font-mono text-sm"
                onFocus={(event) => event.currentTarget.select()}
              />
              {share.expiresAt ? (
                <p className="text-role-caption text-fg-secondary">
                  {m.shareExpires.replace("{date}", new Date(share.expiresAt).toLocaleDateString())}
                </p>
              ) : null}
              {copied ? (
                <p className="text-role-caption text-fg-secondary" role="status">
                  {m.shareCopied}
                </p>
              ) : null}
            </div>
          ) : null}

          {status === "revoked" ? (
            <p className="text-role-body text-fg-secondary" role="status">
              {m.shareRevoked}
            </p>
          ) : null}

          {status === "revoking" ? (
            <p className="text-role-body text-fg-secondary">{m.shareRevoking}</p>
          ) : null}
        </div>

        <DialogFooter>
          {status === "ready" && share ? (
            <>
              <Button type="button" className="min-h-11" onClick={() => void copyLink()}>
                {copied ? m.shareCopiedCta : m.shareCopyCta}
              </Button>
              <Button type="button" variant="outline" className="min-h-11" onClick={() => void onRevoke()}>
                {m.shareRevokeCta}
              </Button>
            </>
          ) : null}
          {status === "error" ? (
            <>
              {onRetry ? (
                <Button type="button" className="min-h-11" onClick={() => void onRetry()}>
                  {m.retry}
                </Button>
              ) : null}
              <Button type="button" variant="outline" className="min-h-11" onClick={() => onOpenChange(false)}>
                {m.shareClose}
              </Button>
            </>
          ) : null}
          {status === "revoked" ? (
            <Button type="button" variant="outline" className="min-h-11" onClick={() => onOpenChange(false)}>
              {m.shareClose}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
