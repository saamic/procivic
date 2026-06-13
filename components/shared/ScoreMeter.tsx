import * as React from "react";
import { scoreVisual, pct } from "@/lib/scores";
import { cn } from "@/lib/utils";

export interface ScoreInput {
  label: string;
  value: string | number;
}

/**
 * A labeled 0..100 meter with its inputs visible (RUBRIC G2/G3: no black box).
 * Same color language as ScoreChip.
 */
export function ScoreMeter({
  label,
  value,
  sublabel,
  inputs,
  className,
}: {
  label: string;
  value: number;
  sublabel?: string;
  inputs?: ScoreInput[];
  className?: string;
}) {
  const v = scoreVisual(value);
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className={cn("tabular text-base font-bold", v.text)}>
          {pct(value)}
        </span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500", v.bgSolid)}
          style={{ width: pct(value) }}
        />
      </div>
      {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
      {inputs && inputs.length > 0 && (
        <dl className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
          {inputs.map((inp) => (
            <div key={inp.label} className="flex items-center gap-1.5">
              <dt className="text-xs text-muted-foreground">{inp.label}</dt>
              <dd className="tabular text-xs font-semibold text-foreground">
                {inp.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
