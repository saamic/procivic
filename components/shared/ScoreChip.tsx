import * as React from "react";
import { scoreVisual, pct } from "@/lib/scores";
import { cn } from "@/lib/utils";

/**
 * Compact score pill in the ONE score color language (low=signal, mid=accent, high=brand).
 * Used for Alignment / Consistency / Transparency / Confidence wherever space is tight.
 */
export function ScoreChip({
  value,
  label,
  size = "md",
  className,
}: {
  value: number;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const v = scoreVisual(value);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        v.bgSoft,
        v.text,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        className
      )}
    >
      {label && <span className="font-medium opacity-80">{label}</span>}
      <span className="tabular">{pct(value)}</span>
    </span>
  );
}
