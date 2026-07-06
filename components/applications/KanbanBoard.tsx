"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import ApplicationCard from "@/components/applications/ApplicationCard";
import AddApplicationDialog from "@/components/applications/AddApplicationDialog";
import ApplicationDetailDrawer from "@/components/applications/ApplicationDetailDrawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  APPLICATION_COLUMNS,
  columnDroppableId,
  parseColumnDroppableId,
  type Application,
  type ApplicationStatus,
} from "@/lib/applications";
import type { useApplications } from "@/hooks/use-applications";

type ApplicationsApi = Pick<
  ReturnType<typeof useApplications>,
  "applications" | "createApplication" | "updateApplication" | "moveApplication" | "deleteApplication"
>;

function KanbanColumn({
  status,
  label,
  description,
  applications,
  onOpen,
}: {
  status: ApplicationStatus;
  label: string;
  description: string;
  applications: Application[];
  onOpen: (application: Application) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnDroppableId(status),
    data: { type: "column", status },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-[min(100%,280px)] shrink-0 flex-col rounded-xl border border-border bg-muted/20",
        isOver && "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-background",
      )}
    >
      <header className="border-b border-border px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-body font-semibold">{label}</h3>
          <span className="rounded-full bg-[var(--accent-subtle)] px-2 py-1 text-caption font-semibold tabular-nums text-[var(--accent)]">
            {applications.length}
          </span>
        </div>
        <p className="mt-1 text-caption text-muted-foreground">{description}</p>
      </header>

      <ul className="flex min-h-[120px] flex-1 flex-col gap-2 p-2">
        {applications.length === 0 ? (
          <li className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-caption text-muted-foreground">
            Drop applications here
          </li>
        ) : (
          applications.map((application) => (
            <li key={application.id}>
              <ApplicationCard application={application} onOpen={onOpen} />
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default function KanbanBoard({
  applications,
  createApplication,
  updateApplication,
  moveApplication,
  deleteApplication,
}: ApplicationsApi) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<Application | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const byStatus = useMemo(() => {
    const map: Record<ApplicationStatus, Application[]> = {
      applied: [],
      screening: [],
      interview: [],
      offer: [],
      rejected: [],
    };
    for (const app of applications) {
      map[app.status].push(app);
    }
    return map;
  }, [applications]);

  const activeApplication = activeId ? applications.find((a) => a.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const applicationId = String(active.id);
    const application = applications.find((a) => a.id === applicationId);
    if (!application) return;

    let targetStatus: ApplicationStatus | null = null;

    const overData = over.data.current;
    if (overData?.type === "column" && overData.status) {
      targetStatus = overData.status as ApplicationStatus;
    } else {
      targetStatus = parseColumnDroppableId(over.id);
      if (!targetStatus) {
        const overApp = applications.find((a) => a.id === over.id);
        if (overApp) targetStatus = overApp.status;
      }
    }

    if (!targetStatus || targetStatus === application.status) return;

    try {
      await moveApplication(applicationId, targetStatus);
    } catch {
      /* optimistic rollback handled by realtime / refetch */
    }
  }

  function openDrawer(application: Application) {
    setSelected(application);
    setDrawerOpen(true);
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-heading-l">Application Tracker</h1>
          <p className="mt-1 text-body text-muted-foreground">
            Drag cards across stages · {applications.length} total applications
          </p>
        </div>
        <Button type="button" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Application
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={(e) => void handleDragEnd(e)}
      >
        <div className="flex gap-3 overflow-x-auto pb-2 pt-1">
          {APPLICATION_COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              status={column.id}
              label={column.label}
              description={column.description}
              applications={byStatus[column.id]}
              onOpen={openDrawer}
            />
          ))}
        </div>

        <DragOverlay>
          {activeApplication ? (
            <div className="w-[260px] rotate-2 opacity-95">
              <ApplicationCard application={activeApplication} onOpen={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <AddApplicationDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={createApplication}
      />

      <ApplicationDetailDrawer
        application={selected}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onUpdate={updateApplication}
        onDelete={deleteApplication}
      />
    </>
  );
}
