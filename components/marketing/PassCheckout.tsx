"use client";

import { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { activePassSentence, formatPassUntil } from "@/lib/billing/display";
import type { PassPlanId } from "@/lib/billing/plans";

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export type PassCheckoutOption = {
  id: PassPlanId;
  label: string;
  priceLabel: string;
  amountPaise: number;
  currency: "INR";
};

type OrderResponse = {
  orderId?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
  error?: string;
};

type RazorpaySuccess = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", handler: () => void) => void;
};

type RazorpayCheckout = {
  Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
};

function checkoutCtor(): RazorpayCheckout["Razorpay"] | undefined {
  return (window as Window & RazorpayCheckout).Razorpay;
}

async function waitForCheckout(timeoutMs: number): Promise<boolean> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (checkoutCtor()) return true;
    await new Promise((resolve) => {
      window.setTimeout(resolve, 50);
    });
  }
  return Boolean(checkoutCtor());
}

export function PassCheckout({
  signedIn,
  options,
  taxWording,
}: {
  signedIn: boolean;
  options: PassCheckoutOption[];
  taxWording: string;
}) {
  const [loadScript, setLoadScript] = useState(false);
  const [busyId, setBusyId] = useState<PassPlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeUntil, setActiveUntil] = useState<string | null>(null);

  async function verify(response: RazorpaySuccess) {
    const res = await fetch("/api/billing/razorpay/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      }),
    });
    const data = (await res.json()) as { ok?: boolean; grantedUntil?: string; error?: string };
    if (!res.ok || !data.ok || typeof data.grantedUntil !== "string") {
      setError(typeof data.error === "string" ? data.error : "Payment could not be verified.");
      return;
    }
    const label = formatPassUntil(data.grantedUntil);
    setActiveUntil(label);
    setError(null);
  }

  function openCheckout(order: OrderResponse, option: PassCheckoutOption) {
    const Ctor = checkoutCtor();
    if (!Ctor || !order.orderId || !order.keyId || order.amount == null || !order.currency) {
      setError("Checkout could not load. Try again.");
      setBusyId(null);
      return;
    }
    if (order.amount !== option.amountPaise || order.currency !== option.currency) {
      setError("Checkout could not be started.");
      setBusyId(null);
      return;
    }
    const checkout = new Ctor({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "WorkGraph",
      description: option.label,
      order_id: order.orderId,
      handler: (response: RazorpaySuccess) => {
        void verify(response).finally(() => setBusyId(null));
      },
      modal: {
        ondismiss: () => setBusyId(null),
      },
    });
    checkout.on("payment.failed", () => {
      setError("Payment was not completed.");
      setBusyId(null);
    });
    try {
      checkout.open();
    } catch {
      setError("Checkout could not load. Try again.");
      setBusyId(null);
    }
  }

  async function buy(option: PassCheckoutOption) {
    setError(null);
    setActiveUntil(null);
    setBusyId(option.id);
    setLoadScript(true);
    try {
      const [res] = await Promise.all([
        fetch("/api/billing/razorpay/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: option.id }),
        }),
        waitForCheckout(8000),
      ]);
      const data = (await res.json()) as OrderResponse;
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not start checkout.");
        setBusyId(null);
        return;
      }
      openCheckout(data, option);
    } catch {
      setError("Could not start checkout.");
      setBusyId(null);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      {loadScript ? <Script src={CHECKOUT_SRC} strategy="afterInteractive" /> : null}
      <ul className="space-y-3">
        {options.map((option) => (
          <li key={option.id} className="space-y-2">
            <Text role="body">{option.label}</Text>
            <Text role="subheading">{option.priceLabel}</Text>
            <Text role="caption" className="text-ink-muted">{taxWording}</Text>
            {signedIn ? (
              <Button
                type="button"
                className="min-h-11"
                disabled={busyId !== null}
                loading={busyId === option.id}
                onClick={() => void buy(option)}
              >
                Buy
              </Button>
            ) : (
              <Button asChild variant="secondary" className="min-h-11">
                <Link href="/login?next=/pricing">Sign in to buy</Link>
              </Button>
            )}
          </li>
        ))}
      </ul>
      <Text role="body-small">One-time payment. Does not auto-renew.</Text>
      {activeUntil ? <Text role="body">{activePassSentence(activeUntil)}</Text> : null}
      {error ? (
        <Text role="body-small" className="text-destructive">
          {error}
        </Text>
      ) : null}
    </div>
  );
}
