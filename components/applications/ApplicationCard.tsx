"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { format, parseISO } from "date-fns";
import { GripVertical } from "lucide-react";
import { iconClass } from "@/lib/icon-styles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { companyLogoUrl, type Application } from "@/lib/applications";

type Props = {
  application: Application;
  onOpen: (application: Application) => void;
};

function formatDateLabel(iso: string): string {
  try {
    return format(parseISO(iso.length === 10 ? `${iso}T00:00:00` : iso), "MMM d, yyyy");
  } catch {
    return iso;
  }
}

export default function ApplicationCard({ application, onOpen }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
    data: { type: "application", application },
  });

  const logo = companyLogoUrl(application.company, application.job_url);

  return (
    <Card
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
      }}
      className={cn(
        "wg-dash-section-card cursor-pointer border-border bg-card shadow-sm transition-shadow hover:shadow-md",
        isDragging && "opacity-40 ring-2 ring-[var(--dash-accent)]",
      )}
      onClick={() => onOpen(application)}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <button
            type="button"
            className="mt-0.5 shrink-0 touch-none text-muted-foreground hover:text-foreground"
            aria-label="Drag application"
            onClick={(e) => e.stopPropagation()}
            {...listeners}
            {...attributes}
          >
            <GripVertical className={iconClass()} />
          </button>
          <Avatar className="h-9 w-9 shrink-0 rounded-md">
            {logo ? <AvatarImage src={logo} alt="" /> : null}
            <AvatarFallback className="rounded-md bg-[var(--dash-accent-soft)] text-xs font-semibold text-[var(--dash-accent)]">
              {application.company.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-snug">{application.role}</p>
            <p className="truncate text-xs text-muted-foreground">{application.company}</p>
            <dl className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
              <div className="flex justify-between gap-2">
                <dt>Applied</dt>
                <dd className="tabular-nums text-foreground/80">
                  {formatDateLabel(application.applied_date)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Updated</dt>
                <dd className="tabular-nums text-foreground/80">
                  {formatDateLabel(application.updated_at)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
