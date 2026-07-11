export function SectionSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse bg-[#F3F2EF] py-20 sm:py-24 lg:py-28 ${className ?? ""}`}
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto h-4 w-32 rounded-full bg-[#E5E5E5]" />
        <div className="mx-auto mt-6 h-10 w-full max-w-lg rounded-xl bg-[#E5E5E5]" />
        <div className="mx-auto mt-4 h-4 w-full max-w-md rounded-full bg-[#E5E5E5]" />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-[#E5E5E5]/80" />
          ))}
        </div>
      </div>
    </div>
  );
}
