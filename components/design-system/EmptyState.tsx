"use client";

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
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900",
        className,
      )}
    >
      <span className="relative mb-4 flex h-16 w-16 items-center justify-center">
        <span
          className="absolute inset-0 rounded-2xl bg-red-50 dark:bg-red-950/40"
          aria-hidden
        />
        <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-white text-red-500 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-900 dark:text-red-400 dark:ring-slate-700">
          <WgIcon icon={icon} size="standalone" />
        </span>
      </span>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
