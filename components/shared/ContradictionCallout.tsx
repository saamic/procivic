import * as React from "react";
import { Quote, Vote as VoteIcon, Coins } from "lucide-react";
import type { IssueId } from "@/config/issues";
import { IssueBadge } from "@/components/shared/IssueBadge";
import { SourceLink } from "@/components/shared/SourceLink";
import { formatUSD, cn } from "@/lib/utils";

export interface ContradictionVote {
  title: string;
  position: string;
  sourceUrl: string;
}

/**
 * The "receipt" (DESIGN §8.1): said X, voted Y — and (optionally) here's the donor who
 * benefited. The emotional beat of a Tier-1 profile. Uses the gradient-receipt accent.
 * Strictly factual: a quoted statement + the contradicting roll-call(s), each cited.
 */
export function ContradictionCallout({
  issue,
  statement,
  votes,
  donor,
  note,
  className,
}: {
  issue: IssueId;
  statement: { text: string; sourceUrl: string };
  votes: ContradictionVote[];
  donor?: { name: string; amount?: number; sourceUrl?: string };
  note?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-accent-200 bg-white shadow-elev-2",
        className
      )}
    >
      <div className="bg-gradient-receipt px-4 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold uppercase tracking-wide text-white">
            The receipt
          </span>
          <IssueBadge
            issue={issue}
            size="sm"
            className="border-white/30 bg-white/20 text-white"
          />
        </div>
      </div>
      <div className="space-y-4 p-4">
        <div className="flex gap-3">
          <Quote className="h-5 w-5 shrink-0 text-accent-500" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Said
            </p>
            <blockquote className="text-sm italic text-foreground">
              “{statement.text}”
            </blockquote>
            <SourceLink href={statement.sourceUrl}>stated position</SourceLink>
          </div>
        </div>

        <div className="flex gap-3">
          <VoteIcon className="h-5 w-5 shrink-0 text-signal-500" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              But voted
            </p>
            <ul className="mt-1 space-y-1.5">
              {votes.map((v, i) => (
                <li key={i} className="text-sm">
                  <span className="font-semibold text-signal-700">
                    {v.position}
                  </span>{" "}
                  <span className="text-foreground">on {v.title}</span>{" "}
                  <SourceLink href={v.sourceUrl}>roll-call</SourceLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {donor && (
          <div className="flex items-center gap-3 rounded-lg bg-accent-50 p-3">
            <Coins className="h-5 w-5 shrink-0 text-accent-600" aria-hidden />
            <p className="text-sm text-foreground">
              <span className="font-semibold">{donor.name}</span>
              {donor.amount != null && (
                <>
                  {" "}
                  contributed{" "}
                  <span className="tabular font-semibold">
                    {formatUSD(donor.amount)}
                  </span>
                </>
              )}{" "}
              {donor.sourceUrl && (
                <SourceLink href={donor.sourceUrl}>FEC record</SourceLink>
              )}
            </p>
          </div>
        )}

        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
    </div>
  );
}
