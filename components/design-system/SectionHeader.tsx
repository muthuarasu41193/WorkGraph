import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export default function SectionHeader({ title, description, action, className }: Props) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="space-y-1">
        <h2 className="text-body-lg font-semibold tracking-tight text-[var(--text-primary)]">{title}</h2>
        {description ? (
          <p className="text-body text-[var(--text-secondary)]">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
