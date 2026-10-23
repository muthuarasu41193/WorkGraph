import type { CompanyBrand } from "@/lib/brands";
import { COMPANY_LABELS } from "@/lib/brands";
import { CompanyBrandIcon } from "@/components/brand/brand-icons";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  brand: CompanyBrand;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Show on dark backgrounds (Interview Vault) */
  onDark?: boolean;
};

const SIZE = {
  sm: { box: "size-8", icon: "size-4" },
  md: { box: "size-10", icon: "size-5" },
  lg: { box: "size-12", icon: "size-6" },
} as const;

const BRAND_ICON_COLORS: Partial<Record<CompanyBrand, string>> = {
  meta: "text-[var(--mark-meta)]",
  amazon: "text-[var(--mark-amazon)]",
  stripe: "text-[var(--mark-stripe)]",
  netflix: "text-[var(--mark-netflix)]",
  apple: "text-fg-primary",
  airbnb: "text-[var(--mark-airbnb)]",
  databricks: "text-[var(--mark-databricks)]",
  notion: "text-fg-primary",
};

export function BrandLogo({ brand, size = "md", className, onDark }: BrandLogoProps) {
  const dims = SIZE[size];
  const label = COMPANY_LABELS[brand];
  const iconColor = BRAND_ICON_COLORS[brand];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg border",
        dims.box,
        onDark
          ? "border-ink-muted bg-surface"
          : "border-border-default bg-surface shadow-sm",
        className,
      )}
      title={label}
      aria-label={label}
    >
      <CompanyBrandIcon brand={brand} className={cn(dims.icon, iconColor)} />
    </span>
  );
}
