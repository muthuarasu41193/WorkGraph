import Link from "next/link";
import { AppShell } from "@/components/layout";
import { WorkGraphLogo } from "@/components/brand/WorkGraphLogo";
import ResumeUploader from "../../components/resume/ResumeUploader";

export default function UploadPage() {
  return (
    <AppShell className="bg-surface-primary">
      <AppShell.Header className="border-b bg-surface-primary/95 backdrop-blur">
        <div className="mx-auto flex h-full max-w-[600px] items-center px-6">
          <Link href="/profile">
            <WorkGraphLogo />
          </Link>
        </div>
      </AppShell.Header>

      <AppShell.Body>
        <AppShell.Main className="mx-auto w-full max-w-[600px]">
          <AppShell.Page>
            <AppShell.PageHeader padding={false}>
              <div className="text-center">
                <h1 className="mt-3 text-heading-xl text-text-primary">Upload Your Resume</h1>
                <p className="mt-3 text-body leading-6 text-[var(--text-secondary)]">
                  Our AI will parse your resume, score it for ATS compatibility, and build your
                  professional profile automatically.
                </p>
              </div>
            </AppShell.PageHeader>

            <AppShell.Content constrained={false}>
              <ResumeUploader />
            </AppShell.Content>
          </AppShell.Page>
        </AppShell.Main>
      </AppShell.Body>
    </AppShell>
  );
}
