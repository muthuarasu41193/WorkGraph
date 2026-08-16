import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  href?: string;
};

export function Logo({ className, href = "/" }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn("group flex items-center gap-2.5", className)}
      aria-label="workgraph home"
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className="shrink-0 transition-transform duration-200 group-hover:scale-105"
      >
        <path d="M14 3L25 23H3L14 3Z" fill="var(--wg-text-primary)" className="dark:fill-white" />
        <path
          d="M14 8L20.5 20H7.5L14 8Z"
          fill="var(--wg-primary)"
          className="opacity-90"
        />
      </svg>
      <span className="font-heading text-xl font-bold tracking-tight text-fg-primary lowercase dark:text-white">
        workgraph
      </span>
    </Link>
  );
}
