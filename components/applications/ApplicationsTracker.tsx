"use client";

import KanbanBoard from "@/components/applications/KanbanBoard";
import DashboardSectionSkeleton from "@/components/dashboard/DashboardSectionSkeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useApplications } from "@/hooks/use-applications";
import { supabaseConfigured } from "@/lib/supabase-enabled";

type Props = {
  userId: string;
};

export default function ApplicationsTracker({ userId }: Props) {
  const api = useApplications(userId);

  if (!supabaseConfigured()) {
    return (
      <Alert>
        <AlertTitle>Supabase required</AlertTitle>
        <AlertDescription>
          Configure <code className="text-role-caption">NEXT_PUBLIC_SUPABASE_URL</code> and run the applications
          migration to use the tracker.
        </AlertDescription>
      </Alert>
    );
  }

  if (api.loading) {
    return <DashboardSectionSkeleton />;
  }

  if (api.error) {
    return (
      <div className="wg-stack-group">
        <Alert variant="destructive">
          <AlertTitle>Could not load applications</AlertTitle>
          <AlertDescription>{api.error}</AlertDescription>
        </Alert>
        <Button type="button" variant="outline" onClick={() => void api.refresh()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="wg-section-stack-lg">
      <KanbanBoard
        applications={api.applications}
        createApplication={api.createApplication}
        updateApplication={api.updateApplication}
        moveApplication={api.moveApplication}
        deleteApplication={api.deleteApplication}
      />
    </div>
  );
}
