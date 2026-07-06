import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export default function EmptyState({ icon: Icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "wg-dash-section-card flex flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
    >
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-subtle)] text-[var(--accent)]">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <h3 className="text-body-lg font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-1.5 max-w-sm text-body text-[var(--text-secondary)]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
