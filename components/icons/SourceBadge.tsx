import Link from "next/link";
import SourceIcon from "@/components/icons/SourceIcon";
import {
  JOB_SOURCE_ICON_LABELS,
  resolveJobSourceIconKey,
  type JobSourceIconKey,
} from "@/lib/source-icons";
import { cn } from "@/lib/utils";

type Props = {
  /** Schema `source` when available; URL is used as fallback. */
  source?: JobSourceIconKey | string | null;
  url?: string | null;
  /** When set, the badge becomes a link (typically the apply / listing URL). */
  href?: string | null;
  className?: string;
  iconSize?: number;
};

/**
 * Caption-style source chip: brand icon tile + label.
 * Used on job cards and community posts.
 */
export default function SourceBadge({
  source,
  url,
  href,
  className,
  iconSize = 16,
}: Props) {
  const key = resolveJobSourceIconKey(source, url ?? href);
  const label = JOB_SOURCE_ICON_LABELS[key];
  const link = href?.trim() || undefined;

  const content = (
    <>
      <SourceIcon source={key} url={url ?? href} size={iconSize} />
      <span className="text-role-caption text-ink-muted">{label}</span>
    </>
  );

  const classes = cn("inline-flex items-center gap-[var(--space-2)]", className);

  if (link) {
    return (
      <Link
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          classes,
          "min-h-11 no-underline transition-colors hover:[&>span:last-child]:text-ink",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {content}
      </Link>
    );
  }

  return <span className={classes}>{content}</span>;
}
