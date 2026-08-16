import Link from "next/link";
import type { SocialBrand } from "@/lib/brands";
import { SOCIAL_LINKS } from "@/lib/constants";
import { SocialBrandIcon } from "@/components/brand/brand-icons";
import { cn } from "@/lib/utils";

const SOCIAL_BRAND_MAP: Record<(typeof SOCIAL_LINKS)[number]["label"], SocialBrand> = {
  Twitter: "x",
  LinkedIn: "linkedin",
  GitHub: "github",
  Discord: "discord",
};

type SocialLinksProps = {
  className?: string;
  iconClassName?: string;
};

export function SocialLinks({ className, iconClassName }: SocialLinksProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      {SOCIAL_LINKS.map((social) => {
        const brand = SOCIAL_BRAND_MAP[social.label];
        return (
          <a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.label}
            className="text-fg-tertiary transition-all duration-200 hover:scale-110 hover:text-brand"
          >
            <SocialBrandIcon brand={brand} className={cn("size-5", iconClassName)} />
          </a>
        );
      })}
    </div>
  );
}

export function SocialLinksAsButtons({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {SOCIAL_LINKS.map((social) => {
        const brand = SOCIAL_BRAND_MAP[social.label];
        return (
          <Link
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.label}
            className="flex size-9 items-center justify-center rounded-lg border border-border-default bg-surface text-fg-secondary transition-all hover:border-brand/30 hover:text-brand"
          >
            <SocialBrandIcon brand={brand} className="size-4" />
          </Link>
        );
      })}
    </div>
  );
}
