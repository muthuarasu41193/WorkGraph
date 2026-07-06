import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  className?: string;
};

export default function StatCard({ label, value, description, icon: Icon, className }: Props) {
  return (
    <Card variant="dashboard" className={cn("wg-dash-card-lift p-5", className)}>
      <CardContent className="flex items-start justify-between gap-3 p-0">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-caption font-medium text-[var(--text-secondary)]">{label}</p>
          <p className="text-heading-l tabular-nums text-[var(--text-primary)]">{value}</p>
          {description ? (
            <p className="text-caption leading-relaxed text-[var(--text-secondary)]">{description}</p>
          ) : null}
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)]">
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </span>
      </CardContent>
    </Card>
  );
}
