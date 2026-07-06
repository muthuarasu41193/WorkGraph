"use client";

import Link from "next/link";
import { BadgeCheck, Building2, ExternalLink } from "lucide-react";
import PageHeader from "@/components/design-system/PageHeader";
import { VERIFICATION_STATUS_LABELS } from "@/lib/employer/types";
import type { EmployerProfile } from "@/lib/employer/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = {
  profile: EmployerProfile;
  liveSignals: number;
};

export default function CompanyPageHeader({ profile, liveSignals }: Props) {
  return (
    <PageHeader
      pinned
      breadcrumbs={[
        { label: "WorkGraph", href: "/" },
        { label: "Companies", href: "/profile?view=workgraph-direct" },
        { label: profile.company_name },
      ]}
      icon={<Building2 aria-hidden />}
      title={
        <span className="flex flex-wrap items-center gap-2">
          {profile.company_name}
          {profile.verification_status === "verified" ? (
            <Badge className="gap-1 bg-success hover:bg-success">
              <BadgeCheck className="h-3.5 w-3.5" />
              {VERIFICATION_STATUS_LABELS.verified}
            </Badge>
          ) : null}
        </span>
      }
      subtitle={profile.tagline ?? undefined}
      metrics={
        liveSignals > 0
          ? [{ label: "live signals", value: liveSignals, accent: true }]
          : undefined
      }
      primaryAction={
        <Button variant="outline" size="sm" asChild>
          <Link href="/profile?view=workgraph-direct">WorkGraph Direct</Link>
        </Button>
      }
      footer={
        <div className="flex flex-wrap gap-3 text-body text-muted-foreground">
          {profile.team_size ? <span>{profile.team_size} team</span> : null}
          {profile.website_url ? (
            <a
              href={
                profile.website_url.startsWith("http")
                  ? profile.website_url
                  : `https://${profile.website_url}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline"
            >
              Website
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
      }
    />
  );
}
