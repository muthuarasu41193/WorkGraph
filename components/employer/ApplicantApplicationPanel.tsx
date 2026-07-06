"use client";

import {
  ExternalLink,
  FileText,
  GitBranch,
  Globe,
  Link2,
  Mail,
  MapPin,
} from "lucide-react";
import type { ApplicationSnapshot, SignalConnection } from "@/lib/employer/types";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  connection: SignalConnection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function StackOverflowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.986 21.865v-6.404h2.134V24H1.844v-8.539h2.13v6.404h15.012zM6.111 15.573l11.39-2.462 0.455 2.11-11.39 2.462-0.455-2.11zm1.359-5.362L18.76 6.32l0.911 1.984L8.381 12.195l-0.911-1.984zm2.683-4.918l10.044 4.605 0.911-1.984L10.064 3.31l-0.911 1.983z" />
    </svg>
  );
}

function LinkRow({
  href,
  label,
  icon,
}: {
  href: string | null | undefined;
  label: string;
  icon: React.ReactNode;
}) {
  if (!href?.trim()) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-md border px-3 py-2 text-body hover:bg-muted/50"
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    </a>
  );
}

function snapshotFromConnection(connection: SignalConnection): ApplicationSnapshot | null {
  if (connection.application_snapshot) return connection.application_snapshot;
  if (!connection.seeker && !connection.connection_note) return null;
  return {
    full_name: connection.seeker?.full_name ?? null,
    headline: connection.seeker?.headline ?? null,
    email: connection.seeker?.email ?? null,
    location: null,
    summary: null,
    years_of_experience: null,
    skills: connection.seeker?.skills ?? [],
    education: [],
    work_experience: [],
    certifications: [],
    resume_url: null,
    linkedin_url: null,
    github_url: null,
    website_url: null,
    stackoverflow_url: null,
    message: connection.connection_note,
  };
}

export default function ApplicantApplicationPanel({ connection, open, onOpenChange }: Props) {
  if (!connection) return null;

  const app = snapshotFromConnection(connection);
  const displayName = app?.full_name ?? connection.seeker?.full_name ?? "Applicant";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{displayName}</DialogTitle>
          {app?.headline ? (
            <p className="text-body text-muted-foreground">{app.headline}</p>
          ) : null}
        </DialogHeader>

        {!app ? (
          <p className="text-body text-muted-foreground">No application details available.</p>
        ) : (
          <div className="space-y-5 text-body">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-[var(--accent)]/10 text-[var(--accent)]">
                {connection.fit_snapshot?.matchPercent ?? "—"}% fit
              </Badge>
              {connection.fit_snapshot?.matchedSignals?.map((s) => (
                <Badge key={s} variant="secondary">
                  {s}
                </Badge>
              ))}
            </div>

            <div className="space-y-2 text-muted-foreground">
              {app.email ? (
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0" />
                  <a href={`mailto:${app.email}`} className="text-foreground hover:underline">
                    {app.email}
                  </a>
                </p>
              ) : null}
              {app.location ? (
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {app.location}
                </p>
              ) : null}
              {app.years_of_experience != null && app.years_of_experience > 0 ? (
                <p>{app.years_of_experience} years of experience</p>
              ) : null}
            </div>

            {app.resume_url ? (
              <a
                href={app.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-body font-medium text-white hover:bg-[var(--accent)]/90"
              >
                <FileText className="h-4 w-4" />
                View resume
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}

            <div className="grid gap-2">
              <LinkRow href={app.linkedin_url} label="LinkedIn" icon={<Link2 className="h-4 w-4" />} />
              <LinkRow href={app.github_url} label="GitHub" icon={<GitBranch className="h-4 w-4" />} />
              <LinkRow href={app.website_url} label="Website" icon={<Globe className="h-4 w-4" />} />
              <LinkRow
                href={app.stackoverflow_url}
                label="Stack Overflow"
                icon={<StackOverflowIcon className="h-4 w-4" />}
              />
            </div>

            {app.message ? (
              <section>
                <h3 className="mb-2 font-semibold text-foreground">Message</h3>
                <p className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-muted-foreground">
                  {app.message}
                </p>
              </section>
            ) : null}

            {app.summary ? (
              <section>
                <h3 className="mb-2 font-semibold text-foreground">Summary</h3>
                <p className="text-muted-foreground">{app.summary}</p>
              </section>
            ) : null}

            {app.skills.length > 0 ? (
              <section>
                <h3 className="mb-2 font-semibold text-foreground">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {app.skills.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </section>
            ) : null}

            {app.work_experience.length > 0 ? (
              <section>
                <h3 className="mb-2 font-semibold text-foreground">Experience</h3>
                <ul className="space-y-3">
                  {app.work_experience.map((exp, i) => (
                    <li key={`${exp.company}-${exp.title}-${i}`} className="border-l-2 border-muted pl-3">
                      <p className="font-medium text-foreground">{exp.title}</p>
                      <p className="text-muted-foreground">
                        {exp.company}
                        {exp.duration ? ` · ${exp.duration}` : ""}
                      </p>
                      {exp.description ? (
                        <p className="mt-1 text-muted-foreground">{exp.description}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {app.education.length > 0 ? (
              <section>
                <h3 className="mb-2 font-semibold text-foreground">Education</h3>
                <ul className="space-y-2">
                  {app.education.map((ed, i) => (
                    <li key={`${ed.institution}-${i}`}>
                      <p className="font-medium text-foreground">{ed.degree}</p>
                      <p className="text-muted-foreground">
                        {ed.institution}
                        {ed.year ? ` · ${ed.year}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {app.certifications.length > 0 ? (
              <section>
                <h3 className="mb-2 font-semibold text-foreground">Certifications</h3>
                <ul className="list-inside list-disc text-muted-foreground">
                  {app.certifications.map((cert) => (
                    <li key={cert}>{cert}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
