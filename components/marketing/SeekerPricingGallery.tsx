"use client";

import type { ReactNode } from "react";
import { BillingPeriodToggle } from "@/components/marketing/BillingPeriodToggle";
import { PricingFaq } from "@/components/marketing/PricingFaq";
import { RazorpayMark } from "@/components/marketing/RazorpayMark";
import { SeekerPricing } from "@/components/marketing/SeekerPricing";
import { Text } from "@/components/ui/text";
import { PASS_TAX_WORDING_TODO } from "@/lib/billing/plans";
import { useState } from "react";
import type { SeekerBillingPeriod } from "@/lib/billing/pricing-display";

function Block({
  title,
  children,
  dir,
}: {
  title: string;
  children: ReactNode;
  dir?: "ltr" | "rtl";
}) {
  return (
    <section className="space-y-3 border-t border-hairline py-6" dir={dir}>
      <Text as="h2" role="heading">
        {title}
      </Text>
      {children}
    </section>
  );
}

const LONG_FAQ = [
  {
    id: "billing",
    question:
      "How does billing work when I am comparing a thirty-day Pass with a ninety-day Pass and I also want to know whether the charge will appear in my local currency statement?",
    answer:
      "WorkGraph Pass is a one-time payment through Razorpay in Indian rupees. It does not auto-renew. You choose a 30-day or 90-day Pass. When the days end, paid features pause until you buy again. Statements from your bank may show a converted amount; the charge WorkGraph places is always INR.",
  },
  {
    id: "data",
    question: "What happens to my resume and profile data?",
    answer:
      "Razorpay receives payment details only, never resume data. Your profile and resume stay with WorkGraph under the privacy policy. You can export or delete your account from settings.",
  },
  {
    id: "cancellation",
    question: "Can I pause or cancel when I get hired?",
    answer:
      "There is no subscription to cancel. The Pass ends when its days run out and does not renew. Pause or cancel the day you get hired by simply not buying another Pass.",
  },
];

export function SeekerPricingGallery() {
  const [period, setPeriod] = useState<SeekerBillingPeriod>("monthly");

  return (
    <div className="space-y-2">
      <Block title="SeekerPricing — populated">
        <SeekerPricing
          signedIn={false}
          locale="en-IN"
          displayCurrency="INR"
          taxWording={PASS_TAX_WORDING_TODO}
          state="populated"
        />
      </Block>

      <Block title="SeekerPricing — loading">
        <SeekerPricing
          signedIn={false}
          locale="en-IN"
          displayCurrency="INR"
          taxWording={PASS_TAX_WORDING_TODO}
          state="loading"
        />
      </Block>

      <Block title="SeekerPricing — empty">
        <SeekerPricing
          signedIn={false}
          locale="en-IN"
          displayCurrency="INR"
          taxWording={PASS_TAX_WORDING_TODO}
          state="empty"
        />
      </Block>

      <Block title="SeekerPricing — error">
        <SeekerPricing
          signedIn={false}
          locale="en-IN"
          displayCurrency="INR"
          taxWording={PASS_TAX_WORDING_TODO}
          state="error"
        />
      </Block>

      <Block title="SeekerPricing — visitor currency (USD display)">
        <SeekerPricing
          signedIn={true}
          locale="en-US"
          displayCurrency="USD"
          taxWording='incl. of applicable taxes'
          state="populated"
        />
      </Block>

      <Block title="SeekerPricing — long FAQ text">
        <SeekerPricing
          signedIn={false}
          locale="en-IN"
          displayCurrency="INR"
          taxWording={PASS_TAX_WORDING_TODO}
          faqItems={LONG_FAQ}
          state="populated"
        />
      </Block>

      <Block title="SeekerPricing — RTL" dir="rtl">
        <SeekerPricing
          signedIn={false}
          locale="ar-AE"
          displayCurrency="AED"
          taxWording={PASS_TAX_WORDING_TODO}
          state="populated"
        />
      </Block>

      <Block title="BillingPeriodToggle — monthly">
        <BillingPeriodToggle
          period={period}
          onChange={setPeriod}
          annualSavingsLabel={period === "annual" ? "Save ₹198 vs three 30-day Passes" : null}
        />
      </Block>

      <Block title="BillingPeriodToggle — disabled">
        <BillingPeriodToggle
          period="annual"
          onChange={() => undefined}
          annualSavingsLabel="Save ₹198 vs three 30-day Passes"
          disabled
        />
      </Block>

      <Block title="PricingFaq — populated">
        <PricingFaq />
      </Block>

      <Block title="PricingFaq — empty">
        <PricingFaq items={[]} />
      </Block>

      <Block title="RazorpayMark">
        <RazorpayMark />
      </Block>
    </div>
  );
}
