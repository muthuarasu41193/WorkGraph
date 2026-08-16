"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { iconClass } from "@/lib/icon-styles";

type Props = {
  title: string;
  description: string;
  icon: LucideIcon;
  score?: string | number;
  badge?: string;
  action?: ReactNode;
  href?: string;
  className?: string;
};

export default function InsightCard({
  title,
  description,
  icon: Icon,
  score,
  badge,
  action,
  href,
  className,
}: Props) {
  const actionable = Boolean(href) && !action;

  const content = (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-2 left-0 w-[2px] rounded-full bg-gradient-to-b from-red-600 to-red-400"
      />

      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-600">
        <Icon className={iconClass("standalone")} />
      </span>

      <div className="mt-2 space-y-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[14px] font-semibold tracking-tight text-slate-900">{title}</h3>
          {badge ? (
            <span className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {badge}
            </span>
          ) : null}
        </div>
        <p className="text-[13px] leading-snug text-slate-500">{description}</p>
      </div>

      {score !== undefined ? (
        <p className="mt-2 text-xl font-semibold tabular-nums leading-none tracking-tight text-slate-900">{score}</p>
      ) : null}

      {action ? <div className="mt-3">{action}</div> : null}
    </>
  );

  const classes = cn(
    "relative flex flex-col overflow-hidden rounded-[10px] border border-slate-200 bg-white p-4 shadow-none",
    "transition-[border-color,box-shadow] duration-150",
    "hover:border-slate-300 hover:shadow-sm",
    actionable && "cursor-pointer no-underline",
    className,
  );

  if (actionable && href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return <article className={classes}>{content}</article>;
}
