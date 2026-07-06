"use client";

import Link from "next/link";
import PageHeader from "@/components/design-system/PageHeader";
import {
  AppShell,
  AppShellBody,
  AppShellContent,
  AppShellHeader,
  AppShellMain,
  AppShellPage,
} from "@/components/layout/AppShell";
import { WorkGraphLogo } from "@/components/brand/WorkGraphLogo";
import ResumeUploader from "@/components/resume/ResumeUploader";

export default function UploadPage() {
  return (
    <AppShell className="bg-surface-primary">
      <AppShellHeader className="border-b bg-surface-primary/95 backdrop-blur">
        <div className="mx-auto flex h-full max-w-[600px] items-center px-6">
          <Link href="/profile">
            <WorkGraphLogo />
          </Link>
        </div>
      </AppShellHeader>

      <AppShellBody>
        <AppShellMain className="mx-auto w-full max-w-[600px]">
          <AppShellPage>
            <PageHeader
              pinned
              centered
              breadcrumbs={[
                { label: "Home", href: "/profile" },
                { label: "Upload resume" },
              ]}
              title="Upload Your Resume"
              subtitle="Our AI will parse your resume, score it for ATS compatibility, and build your professional profile automatically."
            />

            <AppShellContent constrained={false}>
              <ResumeUploader />
            </AppShellContent>
          </AppShellPage>
        </AppShellMain>
      </AppShellBody>
    </AppShell>
  );
}
