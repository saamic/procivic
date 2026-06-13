import * as React from "react";
import { Coins, Network } from "lucide-react";
import { SourceLink } from "@/components/shared/SourceLink";
import { formatUSD, cn } from "@/lib/utils";

export interface DonorBar {
  name: string;
  amount: number;
  employer?: string;
}
export interface CommitteeBar {
  committee: string;
  amount: number;
}

/**
 * FundingGraph (DESIGN §10) — the money hero. This is the shell + the graceful ranked-bar
 * fallback that always renders (works on small screens, never breaks the demo). The
 * interactive force-directed graph layers on top of this in the candidate profile (Slice 1).
 * Every bar is traceable to a source. Candidate variant = donors -> candidate; measure
 * variant = funders -> YES / NO side.
 */
function Bars({
  rows,
  colorClass,
  max,
}: {
  rows: { label: string; sub?: string; amount: number }[];
  colorClass: string;
  max: number;
}) {
  return (
    <ul className="space-y-2">
      {rows.map((r, i) => (
        <li key={i} className="space-y-1">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="min-w-0 truncate font-medium text-foreground">
              {r.label}
              {r.sub && (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  {r.sub}
                </span>
              )}
            </span>
            <span className="tabular shrink-0 font-semibold text-foreground">
              {formatUSD(r.amount, { compact: true })}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", colorClass)}
              style={{ width: `${max > 0 ? (r.amount / max) * 100 : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function FundingGraph({
  variant = "candidate",
  total,
  donors,
  support,
  oppose,
  sourceUrl,
  maxRows = 8,
  className,
}: {
  variant?: "candidate" | "measure";
  total?: number;
  donors?: DonorBar[];
  support?: CommitteeBar[];
  oppose?: CommitteeBar[];
  sourceUrl?: string;
  maxRows?: number;
  className?: string;
}) {
  const header = (
    <div className="mb-4 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-100 text-accent-600">
          <Network className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold leading-tight">Funding</p>
          {total != null && (
            <p className="tabular text-xs text-muted-foreground">
              {formatUSD(total)} total raised
            </p>
          )}
        </div>
      </div>
      {sourceUrl && <SourceLink href={sourceUrl}>source</SourceLink>}
    </div>
  );

  if (variant === "measure") {
    const sup = (support ?? []).slice(0, maxRows);
    const opp = (oppose ?? []).slice(0, maxRows);
    const supTotal = sup.reduce((a, b) => a + b.amount, 0);
    const oppTotal = opp.reduce((a, b) => a + b.amount, 0);
    const max = Math.max(1, ...sup.map((s) => s.amount), ...opp.map((o) => o.amount));
    return (
      <div className={cn("rounded-xl border border-border bg-card p-4 shadow-elev-1", className)}>
        {header}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                <Coins className="h-4 w-4" /> Supporting
              </span>
              <span className="tabular text-sm font-bold text-brand-700">
                {formatUSD(supTotal, { compact: true })}
              </span>
            </div>
            {sup.length ? (
              <Bars
                rows={sup.map((s) => ({ label: s.committee, amount: s.amount }))}
                colorClass="bg-brand-500"
                max={max}
              />
            ) : (
              <p className="text-xs text-muted-foreground">No committees recorded.</p>
            )}
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-signal-700">
                <Coins className="h-4 w-4" /> Opposing
              </span>
              <span className="tabular text-sm font-bold text-signal-700">
                {formatUSD(oppTotal, { compact: true })}
              </span>
            </div>
            {opp.length ? (
              <Bars
                rows={opp.map((o) => ({ label: o.committee, amount: o.amount }))}
                colorClass="bg-signal-500"
                max={max}
              />
            ) : (
              <p className="text-xs text-muted-foreground">No committees recorded.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // candidate
  const rows = (donors ?? []).slice(0, maxRows);
  const max = Math.max(1, ...rows.map((d) => d.amount));
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4 shadow-elev-1", className)}>
      {header}
      {rows.length ? (
        <Bars
          rows={rows.map((d) => ({ label: d.name, sub: d.employer, amount: d.amount }))}
          colorClass="bg-gradient-decoded"
          max={max}
        />
      ) : (
        <p className="text-sm text-muted-foreground">No itemized donors available.</p>
      )}
    </div>
  );
}
