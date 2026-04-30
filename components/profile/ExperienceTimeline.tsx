import type { WorkExperience } from "../../lib/types";

type Props = {
  experience: WorkExperience[];
};

export default function ExperienceTimeline({ experience }: Props) {
  const items = experience.length
    ? experience
    : [
        {
          title: "No experience added yet",
          company: "",
          duration: "",
          description: "Add your work history to improve profile strength.",
        },
      ];

  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-lg font-semibold text-[#111827]">Work Experience</h2>
      <ol className="relative space-y-5 border-l border-[#E5E7EB] pl-5">
        {items.map((item, idx) => (
          <li key={`${item.title}-${idx}`} className="relative">
            <span className="absolute -left-[25px] top-1.5 h-3 w-3 rounded-full bg-[#7C3AED]" />
            <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
              <p className="text-sm font-semibold text-[#111827]">{item.title}</p>
              {item.company ? <p className="text-sm text-[#6B7280]">{item.company}</p> : null}
              {item.duration ? <p className="text-xs text-[#9CA3AF]">{item.duration}</p> : null}
              <p className="mt-2 text-sm leading-6 text-[#6B7280]">{item.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
