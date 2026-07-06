"use client";

import Link from "next/link";
import { Lock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  buildFullContent,
  buildPreviewContent,
  VAULT_DIFFICULTY_LABELS,
  VAULT_RESULT_LABELS,
  type VaultExperienceListItem,
} from "@/lib/vault";
import { cn } from "@/lib/utils";

type Props = {
  experience: VaultExperienceListItem;
  className?: string;
};

export default function VaultExperienceCard({ experience, className }: Props) {
  const preview = buildPreviewContent(buildFullContent(experience));
  const rating = experience.avg_rating;

  return (
    <Link href={`/interview-vault/${experience.id}`} className={cn("group block", className)}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="flex h-full flex-col p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate font-semibold group-hover:text-primary">{experience.company}</h2>
              <p className="truncate text-body text-muted-foreground">{experience.role}</p>
              {experience.level ? (
                <p className="mt-1 text-caption text-muted-foreground">{experience.level}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Badge variant="secondary">₹{experience.price_inr.toLocaleString("en-IN")}</Badge>
              <Lock className="h-4 w-4 text-muted-foreground" aria-hidden />
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {experience.difficulty ? (
              <Badge variant="outline">{VAULT_DIFFICULTY_LABELS[experience.difficulty]}</Badge>
            ) : null}
            {experience.rounds != null ? (
              <Badge variant="outline">{experience.rounds} rounds</Badge>
            ) : null}
            {experience.result ? (
              <Badge variant="outline">{VAULT_RESULT_LABELS[experience.result]}</Badge>
            ) : null}
          </div>

          {preview ? (
            <p className="mt-3 line-clamp-3 flex-1 text-body text-muted-foreground">{preview}</p>
          ) : (
            <p className="mt-3 flex-1 text-body italic text-muted-foreground">Preview available after opening</p>
          )}

          <div className="mt-3 flex items-center justify-between text-caption text-muted-foreground">
            <span className="flex items-center gap-1">
              {rating != null ? (
                <>
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                  {rating.toFixed(1)}
                </>
              ) : (
                "No ratings yet"
              )}
            </span>
            <span>{experience.sales_count} sold</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
