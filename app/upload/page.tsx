import ResumeUploader from "../../components/resume/ResumeUploader";

export default function UploadPage() {
  return (
    <main className="min-h-screen bg-[#FFFFFF] px-6 py-14">
      <div className="mx-auto w-full max-w-[600px]">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold tracking-wide text-wg-heading">WorkGraph</p>
          <h1 className="mt-3 text-3xl font-semibold text-wg-heading">Upload Your Resume</h1>
          <p className="mt-3 text-sm leading-6 text-wg-muted">
            Our AI will parse your resume, score it for ATS compatibility, and build your
            professional profile automatically.
          </p>
        </div>

        <ResumeUploader />
      </div>
    </main>
  );
}
