import { Inter } from "next/font/google";
import ResumeUploader from "../../components/resume/ResumeUploader";

const inter = Inter({ subsets: ["latin"] });

export default function UploadPage() {
  return (
    <main className={`${inter.className} min-h-screen bg-surface-primary px-6 py-16`}>
      <div className="mx-auto w-full max-w-[600px]">
        <div className="mb-8 text-center">
          <p className="text-body font-semibold tracking-wide text-text-primary">WorkGraph</p>
          <h1 className="mt-3 text-heading-xl text-text-primary">Upload Your Resume</h1>
          <p className="mt-3 text-body leading-6 text-[var(--text-secondary)]">
            Our AI will parse your resume, score it for ATS compatibility, and build your
            professional profile automatically.
          </p>
        </div>

        <ResumeUploader />
      </div>
    </main>
  );
}
