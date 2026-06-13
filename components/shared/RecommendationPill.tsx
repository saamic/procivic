import * as React from "react";
import { ScoreChip } from "@/components/shared/ScoreChip";
import { ConfidenceBadge } from "@/components/shared/ConfidenceBadge";
import { cn } from "@/lib/utils";

/**
 * The "decoded verdict" — e.g. YES · 82% aligned · High. The recommendation token uses
 * the brand gradient (the "decoded" moment); alignment + confidence carry the receipts.
 * Always a calculation over the USER's values, never Procivic's opinion.
 */
export function RecommendationPill({
  recommendation,
  alignment,
  confidence,
  size = "md",
  className,
}: {
  recommendation: string;
  alignment: number;
  confidence: number;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center gap-1.5 rounded-full border border-border bg-white/70 p-1 backdrop-blur-md",
        className
      )}
      role="status"
    >
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-gradient-decoded font-bold uppercase tracking-wide text-white shadow-glow",
          size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3.5 py-1 text-sm"
        )}
      >
        {recommendation}
      </span>
      <ScoreChip value={alignment} label="aligned" size="sm" />
      <ConfidenceBadge value={confidence} size="sm" />
    </div>
  );
}
