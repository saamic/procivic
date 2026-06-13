import * as React from "react";
import type { IssueId } from "@/config/issues";
import { IssueBadge } from "@/components/shared/IssueBadge";
import { SourceLink } from "@/components/shared/SourceLink";
import { cn, clamp } from "@/lib/utils";

export interface WhyFactor {
  issue?: IssueId;
  label?: string;
  /** How well the user and item agree on this issue, 0..1. */
  agree: number;
  /** The user's importance weight on this issue, 0..1. */
  weight: number;
  detail?: string;
  sourceUrl?: string;
}

/**
 * The reviewable rationale (DESIGN §8): which of YOUR priorities drove the score, how
 * much each agreed, every line cited. Sorted by contribution (weight x agreement).
 */
export function WhyBreakdown({
  summary,
  factors,
  className,
}: {
  summary?: string;
  factors: WhyFactor[];
  className?: string;
}) {
  const sorted = [...factors].sort(
    (a, b) => b.weight * b.agree - a.weight * a.agree
  );
  return (
    <div className={cn("space-y-3", className)}>
      {summary && (
        <p className="text-sm leading-relaxed text-foreground">{summary}</p>
      )}
      <ul className="space-y-2">
        {sorted.map((f, i) => {
          const agreePct = Math.round(clamp(f.agree, 0, 1) * 100);
          const tone =
            agreePct >= 67
              ? "bg-brand-500"
              : agreePct >= 40
                ? "bg-accent-500"
                : "bg-signal-500";
          return (
            <li
              key={i}
              className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-border bg-white/60 p-3"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {f.issue ? (
                  <IssueBadge issue={f.issue} size="sm" />
                ) : (
                  <span className="text-sm font-medium">{f.label}</span>
                )}
                {f.detail && (
                  <span className="truncate text-xs text-muted-foreground">
                    {f.detail}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", tone)}
                    style={{ width: `${agreePct}%` }}
                  />
                </div>
                <span className="tabular w-9 text-right text-xs font-semibold text-foreground">
                  {agreePct}%
                </span>
                <span
                  className="text-[11px] text-muted-foreground"
                  title="how much you weight this issue"
                >
                  {f.weight >= 0.75
                    ? "high"
                    : f.weight >= 0.4
                      ? "med"
                      : "low"}{" "}
                  priority
                </span>
                {f.sourceUrl && <SourceLink href={f.sourceUrl}>source</SourceLink>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
