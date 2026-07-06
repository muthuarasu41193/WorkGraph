import { cn } from "@/lib/utils";

type WorkGraphLogoProps = {
  className?: string;
  iconClassName?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
};

export function WorkGraphMark({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-8 w-8 shrink-0", className)}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <line x1="16" y1="7" x2="7" y2="23" stroke="var(--accent)" strokeWidth="1.25" strokeLinecap="round" />
      <line x1="16" y1="7" x2="25" y2="23" stroke="var(--accent)" strokeWidth="1.25" strokeLinecap="round" />
      <line x1="9" y1="23" x2="23" y2="23" stroke="var(--accent)" strokeWidth="1.25" strokeLinecap="round" />
      <circle cx="16" cy="7" r="3.25" fill="var(--accent)" />
      <circle cx="7" cy="23" r="3.25" fill="var(--accent)" />
      <circle cx="25" cy="23" r="3.25" fill="var(--accent)" />
    </svg>
  );
}

export function WorkGraphLogo({
  className,
  iconClassName,
  showWordmark = true,
  wordmarkClassName,
}: WorkGraphLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <WorkGraphMark className={iconClassName} />
      {showWordmark ? (
        <span className={cn("text-title leading-none tracking-tight", wordmarkClassName)}>
          <span className="font-normal text-muted-foreground">work</span>
          <span className="font-semibold text-foreground">graph</span>
        </span>
      ) : null}
    </span>
  );
}
