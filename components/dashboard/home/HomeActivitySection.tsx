import ActivityTimeline, { DEMO_TIMELINE_EVENTS } from "@/components/design-system/ActivityTimeline";
import SectionHeader from "@/components/design-system/SectionHeader";

export default function HomeActivitySection() {
  return (
    <section aria-labelledby="activity-heading" className="space-y-4">
      <SectionHeader
        title="Recent Activity"
        description="Your career momentum at a glance."
      />
      <div className="wg-dash-section-card p-5">
        <ActivityTimeline events={DEMO_TIMELINE_EVENTS} />
      </div>
    </section>
  );
}
