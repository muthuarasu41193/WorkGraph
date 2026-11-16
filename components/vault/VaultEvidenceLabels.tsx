"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  VAULT_EVIDENCE_LABEL_DEFINITIONS,
  VAULT_EVIDENCE_LABELS_DISCLAIMER,
  type VaultEvidenceLabelPublic,
} from "@/lib/vault-evidence-labels";
import { cn } from "@/lib/utils";

type Props = {
  labels: readonly VaultEvidenceLabelPublic[];
  className?: string;
  /** Show the explainer trigger next to chips. */
  showExplainer?: boolean;
};

export function VaultEvidenceLabelChips({ labels, className, showExplainer = true }: Props) {
  if (labels.length === 0) return null;

  return (
    <div className={cn("space-y-1.5", className)}>
      <ul className="flex flex-wrap gap-1.5" aria-label="Evidence labels">
        {labels.map((label) => (
          <li key={label.id}>
            <Badge
              variant="outline"
              className="max-w-full whitespace-normal text-left font-normal"
              data-label-id={label.id}
            >
              <span className="sr-only">Evidence label: </span>
              {label.text}
            </Badge>
          </li>
        ))}
      </ul>
      {showExplainer ? <VaultEvidenceLabelsExplainer /> : null}
    </div>
  );
}

export function VaultEvidenceLabelsExplainer() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          What do these labels mean?
        </button>
      </DialogTrigger>
      <DialogContent className="md:max-w-lg" aria-describedby="vault-evidence-labels-desc">
        <DialogHeader>
          <DialogTitle>What do these labels mean?</DialogTitle>
          <DialogDescription id="vault-evidence-labels-desc">
            Labels are independent claims about limited evidence checks. They are not a score or
            ranking tier.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-4">
          {Object.values(VAULT_EVIDENCE_LABEL_DEFINITIONS).map((def) => (
            <li key={def.id} className="space-y-1 border-b border-border pb-3 last:border-0 last:pb-0">
              <p className="text-sm font-medium">{def.buyerText}</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Means: </span>
                {def.means}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Does not mean: </span>
                {def.doesNotMean}
              </p>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground" role="note">
          {VAULT_EVIDENCE_LABELS_DISCLAIMER}
        </p>
      </DialogContent>
    </Dialog>
  );
}
