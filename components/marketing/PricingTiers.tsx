import { headers } from "next/headers";
import { SeekerPricing } from "@/components/marketing/SeekerPricing";
import { PASS_TAX_WORDING_TODO } from "@/lib/billing/plans";
import {
  resolveDisplayCurrency,
  resolvePricingLocale,
} from "@/lib/billing/pricing-display";
import { LIMITS } from "@/lib/subscription";

export async function PricingTiers({ signedIn }: { signedIn: boolean }) {
  const headerList = await headers();
  const acceptLanguage = headerList.get("accept-language");
  const locale = resolvePricingLocale(acceptLanguage);
  const displayCurrency = resolveDisplayCurrency(acceptLanguage);

  return (
    <SeekerPricing
      signedIn={signedIn}
      locale={locale}
      displayCurrency={displayCurrency}
      taxWording={PASS_TAX_WORDING_TODO}
      limits={{
        freeCoverLettersPerMonth: LIMITS.free.coverLettersPerMonth,
        freeTailoringPerMonth: LIMITS.free.tailoringPerMonth,
        proCoverLettersPerMonth: LIMITS.pro.coverLettersPerMonth,
      }}
      // TODO(data) pass annualPlan when a yearly Pass amount is published
      annualPlan={null}
    />
  );
}
