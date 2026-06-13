import * as React from "react";
import { Check, X, Minus } from "lucide-react";
import type { Vote } from "@/lib/types";
import { IssueBadge } from "@/components/shared/IssueBadge";
import { SourceLink } from "@/components/shared/SourceLink";
import { cn } from "@/lib/utils";

/** Position pill — factual (Yea/Nay), not a value judgment, so kept tonally neutral. */
function PositionPill({ position }: { position: string }) {
  const yea = position === "Yea";
  const nay = position === "Nay";
  const Icon = yea ? Check : nay ? X : Minus;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold",
        yea && "bg-brand-100 text-brand-800",
        nay && "bg-slate-200 text-slate-700",
        !yea && !nay && "bg-muted text-muted-foreground"
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {position}
    </span>
  );
}

export function VoteRow({ vote, className }: { vote: Vote; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-border bg-white/60 p-3",
        className
      )}
    >
      <PositionPill position={vote.position} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug text-foreground">
          {vote.title}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <IssueBadge issue={vote.issue} size="sm" />
          <span className="text-xs text-muted-foreground">{vote.billId}</span>
          {vote.date && (
            <span className="text-xs text-muted-foreground">· {vote.date}</span>
          )}
          <SourceLink href={vote.sourceUrl}>roll-call</SourceLink>
        </div>
      </div>
    </div>
  );
}
