import * as React from "react";
import Link from "next/link";
import { ChevronRight, Vote, FileText, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecommendationPill } from "@/components/shared/RecommendationPill";
import { cn } from "@/lib/utils";

export interface BallotItemRecommendation {
  label: string; // e.g. "YES", "Lean NO", "Wiener"
  alignment: number;
  confidence: number;
}

/**
 * A row on the ballot spine (DESIGN §4.2). One component, candidate + measure variants.
 * Shows the decoded verdict (or an honest "data unavailable" label — never silently dropped),
 * a one-line why, and links into the profile.
 */
export function BallotItemCard({
  variant,
  title,
  subtitle,
  href,
  tierLabel,
  recommendation,
  why,
  dataUnavailable = false,
  className,
}: {
  variant: "candidate" | "measure";
  title: string;
  subtitle?: string;
  href: string;
  tierLabel?: string;
  recommendation?: BallotItemRecommendation;
  why?: string;
  dataUnavailable?: boolean;
  className?: string;
}) {
  const Icon = variant === "measure" ? FileText : Vote;
  return (
    <Link href={href} className="group block focus-ring rounded-xl">
      <Card
        glass
        className={cn(
          "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elev-3",
          className
        )}
      >
        <div className="flex items-start gap-3 p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <Icon className="h-5 w-5" aria-hidden />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate font-semibold leading-tight text-foreground">
                  {title}
                </h3>
                {subtitle && (
                  <p className="truncate text-sm text-muted-foreground">
                    {subtitle}
                  </p>
                )}
              </div>
              <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {dataUnavailable ? (
                <Badge variant="muted" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Data unavailable
                </Badge>
              ) : recommendation ? (
                <RecommendationPill
                  recommendation={recommendation.label}
                  alignment={recommendation.alignment}
                  confidence={recommendation.confidence}
                  size="sm"
                />
              ) : (
                <Badge variant="muted">Take the quiz to decode</Badge>
              )}
              {tierLabel && (
                <span className="text-[11px] text-muted-foreground">
                  {tierLabel}
                </span>
              )}
            </div>

            {why && (
              <p className="mt-2 text-sm leading-snug text-muted-foreground">
                {why}
              </p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
