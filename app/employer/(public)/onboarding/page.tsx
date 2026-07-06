"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { AuthSplitShell } from "@/components/auth/AuthSplitShell";
import { slugifyCompany } from "@/lib/employer/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EmployerOnboardingPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [philosophy, setPhilosophy] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/employer/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName,
          company_slug: slug || slugifyCompany(companyName),
          tagline,
          website_url: websiteUrl,
          hiring_philosophy: philosophy,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not save");
        return;
      }
      await fetch("/api/employer/verify", { method: "POST" });
      router.push("/employer/dashboard");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthSplitShell
      panelEyebrow="Employer"
      panelHeadline="Hire through signals, not job-board clones"
      panelDescription="WorkGraph Direct lets you post hiring intent with fit criteria. Seekers connect with their profile graph — you see alignment, not resume spam."
      highlights={[
        "Hiring Signals replace copy-pasted job descriptions",
        "Fit signals score seekers against what you actually need",
        "Pulse inbox uses dialogue stages, not ATS funnel jargon",
      ]}
    >
      <form onSubmit={onSubmit} className="mx-auto w-full max-w-md space-y-5">
        <div>
          <h2 className="text-xl font-semibold">Company setup</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Already a jobseeker? Same account —{" "}
            <Link href="/profile" className="text-[var(--accent)] underline-offset-2 hover:underline">
              switch to seeker view
            </Link>
            .
          </p>
        </div>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="company">Company name</Label>
          <Input
            id="company"
            value={companyName}
            onChange={(e) => {
              setCompanyName(e.target.value);
              if (!slug) setSlug(slugifyCompany(e.target.value));
            }}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Public slug</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="your-company"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="What you build in one line"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Company website</Label>
          <Input
            id="website"
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://yourcompany.com"
          />
          <p className="text-xs text-muted-foreground">
            Used for domain verification (work email must match this domain when possible).
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="philosophy">Hiring philosophy</Label>
          <Textarea
            id="philosophy"
            value={philosophy}
            onChange={(e) => setPhilosophy(e.target.value)}
            rows={3}
            placeholder="How you evaluate people — async trials, portfolio over pedigree, etc."
          />
        </div>
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Continue to dashboard
        </Button>
      </form>
    </AuthSplitShell>
  );
}
