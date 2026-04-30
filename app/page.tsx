import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] px-6 py-16 text-gray-900">
      <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold">WorkGraph</h1>
        <p className="mt-3 text-gray-600">
          Parse resumes, score ATS readiness, and manage your profile with Groq + Supabase.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Login
          </Link>
          <Link
            href="/profile"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100"
          >
            View Profile
          </Link>
        </div>
      </div>
    </main>
  );
}
