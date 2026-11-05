"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Text } from "@/components/ui/text";

export type PricingFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const DEFAULT_SEEKER_PRICING_FAQ: PricingFaqItem[] = [
  {
    id: "billing",
    question: "How does billing work?",
    answer:
      "WorkGraph Pass is a one-time payment through Razorpay in Indian rupees. It does not auto-renew. You choose a 30-day or 90-day Pass. When the days end, paid features pause until you buy again.",
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

type Props = {
  items?: PricingFaqItem[];
  /** // TODO(data) wire locale-specific FAQ when copy is translated */
  locale?: string;
  className?: string;
};

export function PricingFaq({
  items = DEFAULT_SEEKER_PRICING_FAQ,
  className,
}: Props) {
  if (items.length === 0) {
    return (
      <div className={className}>
        {/* TODO(data) FAQ copy not loaded */}
        <Text role="body-small" className="text-ink-muted">
          Billing questions will appear here when available.
        </Text>
      </div>
    );
  }

  return (
    <div className={className}>
      <Text as="h2" role="heading">
        Questions about billing
      </Text>
      <Accordion type="single" collapsible className="mt-4" defaultValue={items[0]?.id}>
        {items.map((item) => (
          <AccordionItem key={item.id} value={item.id}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent>
              <Text role="body" className="text-ink-muted">
                {item.answer}
              </Text>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
