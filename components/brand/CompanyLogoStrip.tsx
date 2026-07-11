import { HIRED_AT_BRANDS } from "@/lib/brands";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { cn } from "@/lib/utils";

export function CompanyLogoStrip({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-3 sm:gap-4",
        className,
      )}
    >
      {HIRED_AT_BRANDS.map((brand) => (
        <BrandLogo key={brand} brand={brand} size="sm" className="opacity-90 transition-opacity hover:opacity-100" />
      ))}
    </div>
  );
}
