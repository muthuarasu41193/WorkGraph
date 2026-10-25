"use client";

import Link from "next/link";
import { useProfileTheme } from "@/components/profile/theme/ProfileThemeProvider";
import PageHero from "@/components/design-system/PageHero";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
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
        <Text as="h2" role="subheading">Privacy</Text>
        <Text role="body-small" className="mt-2 text-ink-muted">
          Recruiter visibility is not stored. Nothing on this page shares your profile with recruiters. Export is not available from here.
        </Text>
      </section>
    </div>
  );
}
