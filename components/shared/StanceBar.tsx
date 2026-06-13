import * as React from "react";
import { clamp, cn } from "@/lib/utils";

/**
 * A neutral -1..+1 issue axis with two labeled poles. Plots an item's stance, and
 * optionally the user's stance for comparison. Poles are descriptive coordinates, NOT
 * value judgments — so the track is neutral (no red=bad / blue=good).
 */
export function StanceBar({
  value,
  poleNeg,
  polePos,
  compareValue,
  entityLabel = "Them",
  compareLabel = "You",
  showLegend = true,
  className,
}: {
  value: number; // -1..+1
  poleNeg: string;
  polePos: string;
  compareValue?: number; // -1..+1 (e.g. the user)
  entityLabel?: string;
  compareLabel?: string;
  showLegend?: boolean; // when false, omit the You/Them key (e.g. a shared legend lives elsewhere)
  className?: string;
}) {
  const toPct = (v: number) => ((clamp(v, -1, 1) + 1) / 2) * 100;
  const pos = toPct(value);
  const cmp = compareValue != null ? toPct(compareValue) : null;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="relative h-2.5 w-full rounded-full bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200">
        {/* center tick */}
        <span className="absolute left-1/2 top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-slate-300" />
        {/* entity marker */}
        <span
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent-500 shadow-elev-1"
          style={{ left: `${pos}%` }}
          title={`${entityLabel}: ${value.toFixed(2)}`}
          aria-label={`${entityLabel} stance ${value.toFixed(2)}`}
        />
        {/* compare (user) marker */}
        {cmp != null && (
          <span
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand-500 bg-white shadow-elev-1"
            style={{ left: `${cmp}%` }}
            title={`${compareLabel}: ${compareValue!.toFixed(2)}`}
            aria-label={`${compareLabel} stance ${compareValue!.toFixed(2)}`}
          />
        )}
      </div>
      <div className="flex justify-between gap-3 text-[11px] leading-tight text-muted-foreground">
        <span className="max-w-[45%]">{poleNeg}</span>
        <span className="max-w-[45%] text-right">{polePos}</span>
      </div>
      {cmp != null && showLegend && (
        <div className="flex items-center gap-3 pt-0.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-brand-500 bg-white" />
            {compareLabel}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-accent-500" />
            {entityLabel}
          </span>
        </div>
      )}
    </div>
  );
}
