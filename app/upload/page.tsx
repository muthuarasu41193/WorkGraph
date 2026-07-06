import Link from "next/link";
import {
  AppShell,
  AppShellBody,
  AppShellContent,
  AppShellHeader,
  AppShellMain,
  AppShellPage,
  AppShellPageHeader,
} from "@/components/layout/AppShell";
import { WorkGraphLogo } from "@/components/brand/WorkGraphLogo";
import ResumeUploader from "../../components/resume/ResumeUploader";

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
            <AppShellPageHeader padding={false}>
              <div className="text-center">
                <h1 className="mt-3 text-heading-xl text-text-primary">Upload Your Resume</h1>
                <p className="mt-3 text-body leading-6 text-[var(--text-secondary)]">
                  Our AI will parse your resume, score it for ATS compatibility, and build your
                  professional profile automatically.
                </p>
              </div>
            </AppShellPageHeader>

            <AppShellContent constrained={false}>
              <ResumeUploader />
            </AppShellContent>
          </AppShellPage>
        </AppShellMain>
      </AppShellBody>
    </AppShell>
  );
}
