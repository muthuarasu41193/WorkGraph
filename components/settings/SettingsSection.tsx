"use client";

import { useProfileTheme } from "@/components/profile/theme/ProfileThemeProvider";
import PageHero from "@/components/design-system/PageHero";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";

export default function SettingsSection() {
  const { resolved, toggle } = useProfileTheme();

  return (
    <div className="space-y-6">
      <PageHero
        title="Settings"
        subtitle="Dark mode is saved on this device. Other preferences on this page are not stored."
      />

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
