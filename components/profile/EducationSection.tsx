import type { Education } from "../../lib/types";

type Props = {
  education: Education[];
};

export default function EducationSection({ education }: Props) {
  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-[#111827]">Education</h2>
      <div className="space-y-3">
        {education.length ? (
          education.map((item, idx) => (
            <div key={`${item.degree}-${idx}`} className="rounded-lg border border-[#E5E7EB] p-4">
              <p className="text-sm font-semibold text-[#111827]">{item.degree}</p>
              <p className="text-sm text-[#6B7280]">{item.institution}</p>
              <p className="text-xs text-[#9CA3AF]">{item.year}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-[#6B7280]">No education records added yet.</p>
        )}
      </div>
    </section>
  );
}
