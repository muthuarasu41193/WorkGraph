import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: LucideIcon;
  className?: string;
};

export default function ErrorState({
  title,
  description,
  action,
  icon: Icon = AlertTriangle,
  className,
}: Props) {
  return (
    <Card
      variant="dashboard"
      className={cn("border-danger/20 bg-danger-subtle/30 text-center", className)}
      role="alert"
    >
      <CardContent className="flex flex-col items-center justify-center px-6 py-12">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-subtle text-danger">
          <Icon className="h-6 w-6" aria-hidden />
        </span>
        <h3 className="text-body-lg font-semibold text-[var(--text-primary)]">{title}</h3>
        <p className="mt-2 max-w-sm text-body text-[var(--text-secondary)]">{description}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
