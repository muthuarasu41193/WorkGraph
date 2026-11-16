import { cn } from "@/lib/utils";

/**
 * Wordmark for the payment provider that is actually integrated.
 * Do not add Stripe or other unused provider logos here.
 */
export function RazorpayMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-role-body-small font-medium text-ink",
        className,
      )}
      role="img"
      aria-label="Razorpay"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        aria-hidden
        className="shrink-0 text-ink"
      >
        <rect
          x="2"
          y="2"
          width="20"
          height="20"
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M7 16 L12 7 L17 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      Razorpay
    </span>
  );
}
