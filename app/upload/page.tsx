import { Inter } from "next/font/google";
import ResumeUploader from "../../components/resume/ResumeUploader";

const inter = Inter({ subsets: ["latin"] });

export default function UploadPage() {
  return (
    <main className={`${inter.className} min-h-screen bg-[#FFFFFF] px-6 py-14`}>
      <div className="mx-auto w-full max-w-[600px]">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold tracking-wide text-[#111827]">WorkGraph</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#111827]">Upload Your Resume</h1>
          <p className="mt-3 text-sm leading-6 text-[#6B7280]">
            Our AI will parse your resume, score it for ATS compatibility, and build your
            professional profile automatically.
          </p>
        </div>

        <ResumeUploader />
      </div>
    </main>
  );
}
