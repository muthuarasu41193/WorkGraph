import Link from "next/link";
import {
  VAULT_TRUST_EXPLANATIONS,
  VAULT_TRUST_LABELS,
  type VaultTrustStatus,
} from "@/lib/vault-trust";
import { cn } from "@/lib/utils";

type Props = {
  statuses: VaultTrustStatus[];
  className?: string;
  compact?: boolean;
};

export function VaultTrustBadges({ statuses, className, compact }: Props) {
  if (statuses.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {statuses.map((status) => (
        <span
          key={status}
          title={VAULT_TRUST_EXPLANATIONS[status]}
          className="inline-flex max-w-full items-center rounded-[var(--radius-tag)] border border-hairline bg-surface px-2 py-0.5 text-role-caption text-ink-muted"
        >
          {VAULT_TRUST_LABELS[status]}
        </span>
      ))}
      {!compact ? (
        <Link
          href="/trust#interview-vault"
          className="text-role-caption text-brand underline-offset-4 hover:underline"
        >
          What these mean
        </Link>
      ) : null}
    </div>
  );
}
