"use client";

import { Bell, Moon, Shield, User } from "lucide-react";
import PageHero from "@/components/design-system/PageHero";
import { useProfileTheme } from "@/components/profile/theme/ProfileThemeProvider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function SettingsSection() {
  const { theme, toggle } = useProfileTheme();

  return (
    <div className="space-y-8">
      <PageHero
        title="Settings"
        subtitle="Manage your account preferences, notifications, and privacy."
      />

      <div className="space-y-6">
        <section className="wg-dash-section-card p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--dash-accent-soft)] text-[var(--dash-accent)]">
              <User className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[var(--dash-text)]">Appearance</h2>
              <p className="text-xs text-[var(--dash-text-secondary)]">Customize how WorkGraph looks</p>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Moon className="h-4 w-4 text-[var(--dash-text-secondary)]" />
              <div>
                <Label htmlFor="dark-mode" className="text-sm font-medium">
                  Dark mode
                </Label>
                <p className="text-xs text-[var(--dash-text-secondary)]">
                  Switch between light and dark themes
                </p>
              </div>
            </div>
            <Checkbox
              id="dark-mode"
              checked={theme === "dark"}
              onCheckedChange={() => toggle()}
            />
          </div>
        </section>

        <section className="wg-dash-section-card p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--dash-accent-soft)] text-[var(--dash-accent)]">
              <Bell className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[var(--dash-text)]">Notifications</h2>
              <p className="text-xs text-[var(--dash-text-secondary)]">
                Control how you receive career updates
              </p>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="space-y-4">
            {[
              { id: "job-matches", label: "New job matches", desc: "When AI finds roles matching your profile" },
              { id: "hidden-jobs", label: "Hidden job alerts", desc: "When new hidden opportunities are discovered" },
              { id: "application-updates", label: "Application updates", desc: "Status changes on your applications" },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor={item.id} className="text-sm font-medium">
                    {item.label}
                  </Label>
                  <p className="text-xs text-[var(--dash-text-secondary)]">{item.desc}</p>
                </div>
                <Checkbox id={item.id} defaultChecked />
              </div>
            ))}
          </div>
        </section>

        <section className="wg-dash-section-card p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--dash-accent-soft)] text-[var(--dash-accent)]">
              <Shield className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[var(--dash-text)]">Privacy & Data</h2>
              <p className="text-xs text-[var(--dash-text-secondary)]">
                Control your data and profile visibility
              </p>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="recruiter-visibility" className="text-sm font-medium">
                  Recruiter visibility
                </Label>
                <p className="text-xs text-[var(--dash-text-secondary)]">
                  Allow recruiters to discover your profile
                </p>
              </div>
              <Checkbox id="recruiter-visibility" defaultChecked />
            </div>
            <Button variant="outline" size="sm" className="wg-dash-compact-btn">
              Export my data
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
