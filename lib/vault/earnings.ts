/**
 * Contributor earnings helpers for Interview Vault.
 * Fee rate is a planning assumption, not final policy — label it in UI.
 */

import { convertInrToCurrency, formatCurrencyAmount } from "@/lib/currency";

/** Planning assumption only. Not final fee policy. Override via VAULT_PLATFORM_FEE_RATE (0–1). */
export const VAULT_PLATFORM_FEE_RATE_DEFAULT = 0.25;

export const VAULT_PLATFORM_FEE_LABEL =
  "Platform fee rate is a planning assumption (not final policy).";

export function getVaultPlatformFeeRate(envValue?: string | null): number {
  const raw = (envValue ?? process.env.VAULT_PLATFORM_FEE_RATE ?? "").trim();
  if (!raw) return VAULT_PLATFORM_FEE_RATE_DEFAULT;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 1) return VAULT_PLATFORM_FEE_RATE_DEFAULT;
  return Math.round(n * 10_000) / 10_000;
}

export type VaultEarningsBreakdown = {
  /** Gross sale amount in INR (from verified purchase rows only). */
  grossInr: number;
  feeRate: number;
  feeInr: number;
  netInr: number;
  grossUsd: number;
  feeUsd: number;
  netUsd: number;
  feeRatePercentLabel: string;
  feePolicyNote: string;
};

function roundMoney(amount: number): number {
  return Math.round(Math.max(0, amount) * 100) / 100;
}

/**
 * Compute fee breakdown from a server-side gross INR total.
 * Never accepts a client-supplied fee or net.
 */
export function computeContributorEarnings(
  grossInr: number,
  feeRate: number = getVaultPlatformFeeRate(),
): VaultEarningsBreakdown {
  const safeGross = Number.isFinite(grossInr) ? Math.max(0, grossInr) : 0;
  const safeRate =
    Number.isFinite(feeRate) && feeRate >= 0 && feeRate <= 1 ? feeRate : VAULT_PLATFORM_FEE_RATE_DEFAULT;
  const feeInr = roundMoney(safeGross * safeRate);
  const netInr = roundMoney(safeGross - feeInr);
  const grossUsd = roundMoney(convertInrToCurrency(safeGross, "USD"));
  const feeUsd = roundMoney(convertInrToCurrency(feeInr, "USD"));
  const netUsd = roundMoney(convertInrToCurrency(netInr, "USD"));
  const percent = Math.round(safeRate * 10_000) / 100;

  return {
    grossInr: roundMoney(safeGross),
    feeRate: safeRate,
    feeInr,
    netInr,
    grossUsd,
    feeUsd,
    netUsd,
    feeRatePercentLabel: `${percent}%`,
    feePolicyNote: VAULT_PLATFORM_FEE_LABEL,
  };
}

export function formatUsdEarnings(amountUsd: number): string {
  return formatCurrencyAmount(amountUsd, "USD", "en-US");
}

/** Empty seller dashboard payload (verified purchases only; zero earnings). */
export function emptyVaultEarningsDashboard() {
  const fee = computeContributorEarnings(0);
  return {
    total_earnings_inr: 0,
    platform_fee_rate: fee.feeRate,
    platform_fee_inr: fee.feeInr,
    net_earnings_inr: fee.netInr,
    gross_earnings_usd: fee.grossUsd,
    platform_fee_usd: fee.feeUsd,
    net_earnings_usd: fee.netUsd,
    fee_rate_percent_label: fee.feeRatePercentLabel,
    fee_policy_note: fee.feePolicyNote,
    total_views: 0,
    total_sales: 0,
    experiences: [] as [],
    sales_by_day: [] as Array<{ date: string; sales: number; earnings_inr: number }>,
  };
}
