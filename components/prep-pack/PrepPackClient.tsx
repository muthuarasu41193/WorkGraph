"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PageContainer } from "@/components/ui/page-container";
import { Textarea } from "@/components/ui/textarea";
import { loginRedirectPath } from "@/lib/client-auth";
import { FOCUS_RING } from "@/lib/focus-ring";
import { formSelectTriggerClasses } from "@/lib/form-field-styles";
import { LIMITS } from "@/lib/validation/primitives";
import { listPrepRoleOptions } from "@/lib/prep-pack/roles";
import { prepPackMessages as m } from "@/lib/prep-pack/messages";
import type {
  PrepPackResult,
  SavedPrepPack,
  SavedPrepPackSummary,
} from "@/lib/prep-pack/types";
import { cn } from "@/lib/utils";

type Props = {
  isSignedIn: boolean;
  initialSaved: SavedPrepPackSummary[];
};

type UiState = "idle" | "loading" | "success" | "empty" | "error";

export default function PrepPackClient({ isSignedIn, initialSaved }: Props) {
  const roles = useMemo(() => listPrepRoleOptions(), []);
  const [roleId, setRoleId] = useState<string>("");
  const [jobDescription, setJobDescription] = useState("");
  const [uiState, setUiState] = useState<UiState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pack, setPack] = useState<PrepPackResult | null>(null);
  const [announce, setAnnounce] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedList, setSavedList] = useState(initialSaved);
  const [viewingSaved, setViewingSaved] = useState<SavedPrepPack | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const charCount = jobDescription.length;
  const hasInput = Boolean(roleId.trim() || jobDescription.trim());
  const canSubmit = hasInput && uiState !== "loading";

  async function buildPack() {
    setUiState("loading");
    setErrorMessage(null);
    setSavedId(null);
    setViewingSaved(null);
    setAnnounce("");

    try {
      const response = await fetch("/api/prep-pack", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          roleId: roleId || undefined,
          jobDescription: jobDescription.trim() || undefined,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; status?: string; pack?: PrepPackResult }
        | null;

      if (!response.ok || !data?.ok || !data.pack) {
        setUiState("error");
        setErrorMessage(data?.error || m.errorBody);
        setAnnounce(m.errorTitle);
        return;
      }

      setPack(data.pack);
      if (data.pack.status === "no_matches" || data.pack.guides.length === 0) {
        setUiState("empty");
        setAnnounce(m.resultsNoGuides);
      } else {
        setUiState("success");
        setAnnounce(m.resultsReady);
      }
    } catch {
      setUiState("error");
      setErrorMessage(m.errorBody);
      setAnnounce(m.errorTitle);
    }
  }

  async function savePack() {
    if (!pack) return;
    if (!isSignedIn) {
      window.location.href = loginRedirectPath("/prep-pack", "save-prep-pack");
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/prep-pack/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          roleId: pack.role?.id ?? null,
          roleLabel: pack.role?.label ?? null,
          skills: pack.skills,
          guides: pack.guides,
          checklist: pack.checklist,
          estimateNotice: pack.estimateNotice,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; pack?: SavedPrepPack }
        | null;

      if (response.status === 401) {
        window.location.href = loginRedirectPath("/prep-pack", "save-prep-pack");
        return;
      }
      if (!response.ok || !data?.ok || !data.pack) {
        setErrorMessage(data?.error || "Could not save prep pack.");
        setAnnounce("Save failed.");
        return;
      }

      setSavedId(data.pack.id);
      setSavedList((prev) => [
        {
          id: data.pack!.id,
          role_id: data.pack!.role_id,
          role_label: data.pack!.role_label,
          skill_count: data.pack!.skill_count,
          guide_count: data.pack!.guide_count,
          created_at: data.pack!.created_at,
          updated_at: data.pack!.updated_at,
        },
        ...prev.filter((item) => item.id !== data.pack!.id),
      ]);
      setAnnounce(m.resultsSaved);
    } catch {
      setErrorMessage("Could not save prep pack.");
      setAnnounce("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function openSaved(id: string) {
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/prep-pack/saved/${id}`, {
        credentials: "include",
      });
      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; pack?: SavedPrepPack }
        | null;
      if (!response.ok || !data?.ok || !data.pack) {
        setErrorMessage(data?.error || "Could not load that prep pack.");
        return;
      }
      setViewingSaved(data.pack);
      setPack({
        role: data.pack.role_id
          ? { id: data.pack.role_id, label: data.pack.role_label ?? data.pack.role_id }
          : null,
        skills: data.pack.skills,
        guides: data.pack.guides,
        checklist: data.pack.checklist,
        estimateNotice: data.pack.estimate_notice,
        status: data.pack.guides.length ? "ok" : "no_matches",
      });
      setUiState(data.pack.guides.length ? "success" : "empty");
      setSavedId(data.pack.id);
      setAnnounce(m.resultsReady);
    } catch {
      setErrorMessage("Could not load that prep pack.");
    }
  }

  async function deleteSaved(id: string) {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/prep-pack/saved/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setErrorMessage(data?.error || "Could not delete that prep pack.");
        return;
      }
      setSavedList((prev) => prev.filter((item) => item.id !== id));
      if (savedId === id) setSavedId(null);
      if (viewingSaved?.id === id) setViewingSaved(null);
      setAnnounce("Prep pack deleted.");
    } catch {
      setErrorMessage("Could not delete that prep pack.");
    } finally {
      setDeletingId(null);
    }
  }

  const showResults = pack && (uiState === "success" || uiState === "empty");

  return (
    <PageContainer className="py-8">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-fg-primary sm:text-3xl">{m.title}</h1>
        <p className="mt-2 text-role-body text-fg-secondary">{m.subtitle}</p>
      </div>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </div>

      <section
        aria-labelledby="prep-pack-form-heading"
        className="max-w-3xl rounded-lg border border-border-default bg-surface p-4 sm:p-6"
      >
        <h2 id="prep-pack-form-heading" className="sr-only">
          Build form
        </h2>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="prep-role">{m.roleLabel}</Label>
            <select
              id="prep-role"
              value={roleId}
              disabled={uiState === "loading"}
              aria-label={m.roleLabel}
              className={cn(formSelectTriggerClasses, "w-full min-h-11")}
              onChange={(event) => setRoleId(event.target.value)}
            >
              <option value="">{m.rolePlaceholder}</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="prep-jd">{m.jdLabel}</Label>
            <p id="prep-jd-hint" className="text-role-caption text-fg-tertiary">
              {m.jdHint}
            </p>
            <Textarea
              id="prep-jd"
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value.slice(0, LIMITS.jobDescription))}
              maxLength={LIMITS.jobDescription}
              rows={8}
              disabled={uiState === "loading"}
              aria-describedby="prep-jd-hint prep-jd-count"
              className="min-h-40"
            />
            <p id="prep-jd-count" className="text-role-caption text-fg-tertiary tabular-nums">
              {m.jdCharCount(charCount, LIMITS.jobDescription)}
            </p>
          </div>

          <div>
            <Button
              type="button"
              className="min-h-11 w-full sm:w-auto"
              disabled={!canSubmit}
              aria-disabled={!canSubmit}
              aria-busy={uiState === "loading"}
              onClick={() => {
                if (!canSubmit) return;
                void buildPack();
              }}
            >
              {uiState === "loading" ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden />
                  {m.building}
                </>
              ) : (
                m.buildCta
              )}
            </Button>
          </div>
        </div>
      </section>

      {uiState === "error" ? (
        <Alert variant="destructive" className="max-w-3xl">
          <AlertTitle>{m.errorTitle}</AlertTitle>
          <AlertDescription>
            <p>{errorMessage || m.errorBody}</p>
            <Button type="button" variant="outline" className="mt-3 min-h-11" onClick={() => void buildPack()}>
              {m.retry}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {showResults ? (
        <div className="flex flex-col gap-8">
          <Alert className="max-w-3xl border-border-default bg-surface-sunken">
            <AlertTitle>Estimate</AlertTitle>
            <AlertDescription>{pack.estimateNotice || m.estimateBanner}</AlertDescription>
          </Alert>

          <section aria-labelledby="prep-skills-heading" className="max-w-3xl">
            <h2 id="prep-skills-heading" className="text-lg font-semibold text-fg-primary">
              {m.skillsHeading}
            </h2>
            {pack.role ? (
              <p className="mt-1 text-role-body text-fg-secondary">Role: {pack.role.label}</p>
            ) : null}
            {pack.skills.length === 0 ? (
              <p className="mt-3 text-role-body text-fg-secondary">{m.skillsEmpty}</p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2" role="list">
                {pack.skills.map((skill) => (
                  <li key={`${skill.source}-${skill.name}`}>
                    <Badge variant="secondary" className="gap-1.5">
                      {skill.name}
                      <span className="text-fg-tertiary">
                        · {skill.source === "job_description" ? m.skillFromJd : m.skillFromRole}
                      </span>
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="prep-guides-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="prep-guides-heading" className="text-lg font-semibold text-fg-primary">
                {m.guidesHeading}
              </h2>
              <Button variant="outline" size="sm" asChild className="min-h-11">
                <Link href="/interview-vault">{m.browseVault}</Link>
              </Button>
            </div>

            {uiState === "empty" || pack.guides.length === 0 ? (
              <div className="mt-3 max-w-3xl rounded-lg border border-dashed border-border-default p-4">
                <p className="font-medium text-fg-primary">{m.noGuidesTitle}</p>
                <p className="mt-1 text-role-body text-fg-secondary">{m.noGuidesBody}</p>
                <Button asChild className="mt-4 min-h-11">
                  <Link href="/interview-vault">{m.browseVault}</Link>
                </Button>
              </div>
            ) : (
              <ul className="mt-4 grid gap-4 sm:grid-cols-2" role="list">
                {pack.guides.map((guide) => (
                  <li key={guide.id}>
                    <article className="flex h-full flex-col rounded-lg border border-border-default bg-surface p-4">
                      <h3 className="font-semibold text-fg-primary">{guide.company}</h3>
                      <p className="text-role-body text-fg-secondary">{guide.role}</p>
                      {guide.level ? (
                        <p className="mt-0.5 text-role-caption text-fg-tertiary">{guide.level}</p>
                      ) : null}
                      {guide.interview_round ? (
                        <p className="mt-0.5 text-role-caption text-fg-tertiary">{guide.interview_round}</p>
                      ) : null}
                      <p className="mt-2 text-role-caption text-fg-tertiary">
                        {guide.last_confirmed_label}
                        {guide.stale && guide.stale_label ? (
                          <>
                            <span aria-hidden="true"> · </span>
                            <span className="font-medium text-caution" role="status">
                              {guide.stale_label}
                            </span>
                          </>
                        ) : null}
                      </p>
                      <div className="mt-3">
                        <p className="text-role-caption font-medium text-fg-secondary">{m.whyHeading}</p>
                        <ul className="mt-1 list-disc space-y-1 pl-5 text-role-caption text-fg-tertiary">
                          {guide.why.map((reason) => (
                            <li key={reason}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-4 grow" />
                      <Button asChild variant="secondary" className={cn("min-h-11 w-full", FOCUS_RING)}>
                        <Link href={guide.href}>{m.openGuide}</Link>
                      </Button>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="prep-checklist-heading" className="max-w-3xl">
            <h2 id="prep-checklist-heading" className="text-lg font-semibold text-fg-primary">
              {m.checklistHeading}
            </h2>
            <ol className="mt-3 space-y-3">
              {pack.checklist.map((item) => (
                <li key={item.id} className="rounded-md border border-border-default px-3 py-2">
                  <p className="text-role-caption font-medium text-fg-tertiary">{item.round}</p>
                  <p className="text-role-body text-fg-primary">{item.text}</p>
                </li>
              ))}
            </ol>
          </section>

          <section
            aria-labelledby="prep-save-heading"
            className="max-w-3xl rounded-lg border border-border-default bg-surface p-4 sm:p-5"
          >
            <h2 id="prep-save-heading" className="text-lg font-semibold text-fg-primary">
              {m.savePromptTitle}
            </h2>
            <p className="mt-1 text-role-body text-fg-secondary">
              {isSignedIn ? m.savePromptBodySignedIn : m.savePromptBodyGuest}
            </p>
            {errorMessage ? (
              <p className="mt-2 text-role-body text-destructive" role="status">
                {errorMessage}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {isSignedIn ? (
                <Button
                  type="button"
                  className="min-h-11"
                  disabled={saving || Boolean(savedId)}
                  aria-busy={saving}
                  onClick={() => void savePack()}
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" aria-hidden />
                      {m.saving}
                    </>
                  ) : savedId ? (
                    m.saved
                  ) : (
                    m.saveCta
                  )}
                </Button>
              ) : (
                <Button asChild className="min-h-11">
                  <Link href={loginRedirectPath("/prep-pack", "save-prep-pack")}>{m.signInToSave}</Link>
                </Button>
              )}
            </div>
          </section>
        </div>
      ) : null}

      {isSignedIn ? (
        <section aria-labelledby="prep-saved-heading" className="max-w-3xl">
          <h2 id="prep-saved-heading" className="text-lg font-semibold text-fg-primary">
            {m.savedHeading}
          </h2>
          {savedList.length === 0 ? (
            <p className="mt-2 text-role-body text-fg-secondary">{m.savedEmpty}</p>
          ) : (
            <ul className="mt-3 divide-y divide-border-default rounded-lg border border-border-default" role="list">
              {savedList.map((item) => (
                <li key={item.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-fg-primary">{item.role_label || "Prep pack"}</p>
                    <p className="text-role-caption text-fg-tertiary">
                      {item.skill_count} skills · {item.guide_count} guides
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="min-h-11"
                      onClick={() => void openSaved(item.id)}
                    >
                      {m.openSaved}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-11"
                      disabled={deletingId === item.id}
                      aria-busy={deletingId === item.id}
                      onClick={() => void deleteSaved(item.id)}
                    >
                      {deletingId === item.id ? m.deleting : m.deleteSaved}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </PageContainer>
  );
}
