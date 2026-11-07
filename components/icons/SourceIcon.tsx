import type { ComponentType, SVGProps } from "react";
import {
  SiGlassdoor,
  SiGithub,
  SiGoogle,
  SiIndeed,
  SiReddit,
  SiX,
} from "@icons-pack/react-simple-icons";
import { Globe } from "lucide-react";
import {
  JOB_SOURCE_ICON_LABELS,
  type JobSourceIconKey,
  resolveJobSourceIconKey,
} from "@/lib/source-icons";
import { cn } from "@/lib/utils";

/**
 * How to add a new source
 * -----------------------
 * 1. Add the key to `JobSourceIconKey` + label/color maps in `lib/source-icons.ts`.
 * 2. Prefer an icon from `@icons-pack/react-simple-icons` (MIT). If Simple Icons
 *    does not ship the mark (e.g. LinkedIn, Naukri), add a small inline SVG here —
 *    do not introduce another icon library.
 * 3. Map hostnames in `DOMAIN_TO_SOURCE` via `getSourceFromUrl`.
 * 4. Keep Lucide for UI chrome only (arrows, menus, Globe fallback).
 * See also `components/icons/README.md`.
 */

type SimpleIconProps = {
  size?: number | string;
  color?: string;
  title?: string;
  className?: string;
};

type Props = {
  source: JobSourceIconKey | string;
  /** Apply / listing URL used when `source` is generic or unknown. */
  url?: string | null;
  /** Glyph size in px. The tile around it is always 24×24. */
  size?: number;
  className?: string;
};

function LinkedInMark({ size = 16, color = "default", className }: SimpleIconProps) {
  const fill = color === "default" ? "var(--mark-linkedin)" : color;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill={fill}
      aria-hidden
    >
      {/* Simple Icons dropped LinkedIn; path matches the public LinkedIn brand mark. */}
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function NaukriMark({ size = 16, color = "default", className }: SimpleIconProps) {
  const fill = color === "default" ? "var(--mark-naukri)" : color;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill={fill}
      aria-hidden
    >
      {/* Naukri is not in Simple Icons; compact “n” mark in brand blue. */}
      <path d="M4.5 3.75h3.6l5.1 8.55V3.75H17.5V20.25h-3.45L8.8 11.4v8.85H4.5V3.75Z" />
    </svg>
  );
}

const BRAND_ICONS: Partial<
  Record<JobSourceIconKey, ComponentType<SimpleIconProps & SVGProps<SVGSVGElement>>>
> = {
  linkedin: LinkedInMark,
  naukri: NaukriMark,
  reddit: SiReddit,
  indeed: SiIndeed,
  glassdoor: SiGlassdoor,
  x: SiX,
  github: SiGithub,
  google: SiGoogle,
};

export default function SourceIcon({ source, url, size = 16, className }: Props) {
  const key = resolveJobSourceIconKey(source, url);
  const label = JOB_SOURCE_ICON_LABELS[key];
  const BrandIcon = BRAND_ICONS[key];

  return (
    <span
      className={cn(
        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-sunken",
        className,
      )}
      title={label}
      aria-label={label}
    >
      {BrandIcon ? (
        <BrandIcon
          size={size}
          color="default"
          title={label}
          aria-hidden
          className="shrink-0"
        />
      ) : (
        <Globe
          size={size}
          strokeWidth={2}
          className="shrink-0 text-ink-muted"
          aria-hidden
        />
      )}
    </span>
  );
}

export type { JobSourceIconKey };
export { getSourceFromUrl, resolveJobSourceIconKey } from "@/lib/source-icons";
