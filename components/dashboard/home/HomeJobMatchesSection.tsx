import { MapPin, Zap } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { JobMatchPreviewExt } from "@/lib/home-dashboard";
import { dashboardHref } from "@/lib/dashboard-routes";

export default function HomeJobMatchesSection({
  jobs,
  feedKind,
}: {
  jobs: JobMatchPreviewExt[];
  feedKind: "live" | "demo";
}) {
  return (
    <section className="space-y-3" aria-labelledby="home-matches-heading">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="home-matches-heading" className="text-lg font-semibold tracking-tight">
            Jobs Matching Your Profile
          </h2>
          <p className="text-sm text-muted-foreground">
            Top {jobs.length || 5} roles ranked by resume fit
            {feedKind === "live" ? " · live catalog" : ""}.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={dashboardHref("jobs")}>View all jobs</Link>
        </Button>
      </div>

      {jobs.length === 0 ? (
        <Card className="wg-dash-section-card border-dashed">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Add skills or resume text to unlock ranked matches, or browse the Jobs tab for live listings.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {jobs.map((job, index) => (
            <li key={job.id}>
              <Card className="wg-dash-section-card transition-shadow hover:shadow-md">
                <CardContent className="flex flex-wrap items-center gap-3 p-4">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--dash-accent-soft)] text-sm font-bold tabular-nums text-[var(--dash-accent)]"
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground">{job.company}</p>
                    <h3 className="font-semibold leading-snug">{job.title}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {job.location}
                      <span className="text-border">·</span>
                      {job.workMode}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:ml-auto">
                    <Badge className="bg-[var(--dash-accent-soft)] text-[var(--dash-accent)] hover:bg-[var(--dash-accent-soft)]">
                      {job.matchPercent}% match
                    </Badge>
                    {job.applyUrl ? (
                      <Button asChild size="sm">
                        <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                          <Zap className="h-3.5 w-3.5" />
                          View
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
