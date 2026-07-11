import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Icon as WgIcon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export default function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "wg-dash-section-card flex flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
    >
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--dash-accent-soft)] text-[var(--dash-accent)]">
        <WgIcon icon={icon} size="standalone" />
      </span>
      <h3 className="text-base font-semibold text-[var(--dash-text)]">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-[var(--dash-text-secondary)]">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
