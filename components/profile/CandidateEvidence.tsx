import * as React from "react";
import { Scale, Vote as VoteIcon } from "lucide-react";
import type { Stance, Vote } from "@/lib/types";
import { ISSUES } from "@/config/issues";
import { ProfileSection } from "@/components/shared/ProfileShell";
import { StanceBar } from "@/components/shared/StanceBar";
import { VoteRow } from "@/components/shared/VoteRow";
import { IssueBadge } from "@/components/shared/IssueBadge";
import { cn } from "@/lib/utils";

/**
 * Tier-1 candidate evidence (DESIGN §11; RUBRIC D1/D2): vote-derived issue stances and
 * the underlying voting record. Pure render of props — composes the shared StanceBar,
 * IssueBadge, VoteRow, and SourceLink (via VoteRow) so the design system stays canonical.
 * The user/quiz vector arrives in a later slice, so no compareValue is plotted here yet.
 */
export function CandidateEvidence({
  stances,
  votes,
  className,
}: {
  stances: Stance[];
  votes: Vote[];
  className?: string;
}) {
  // Preserve the canonical issue order from config, keeping only issues we have a stance for.
  const stanceRows = ISSUES.map((issue) => {
    const stance = stances.find((s) => s.issue === issue.id);
    return stance ? { issue, stance } : null;
  }).filter(
    (row): row is { issue: (typeof ISSUES)[number]; stance: Stance } => row !== null
  );

  return (
    <div className={cn("space-y-6", className)}>
      <ProfileSection
        title="Where they stand"
        icon={Scale}
        description="These stances are derived from real CA State Senate roll-call votes — pole labels are neutral coordinates, not judgments."
      >
        {stanceRows.length === 0 ? (
          <p className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            No vote-derived stances are available for this candidate yet.
          </p>
        ) : (
          <ul className="space-y-5">
            {stanceRows.map(({ issue, stance }) => {
              const billIds = stance.derivedFrom ?? [];
              return (
                <li key={issue.id} className="space-y-2">
                  <IssueBadge issue={issue.id} />
                  <StanceBar
                    value={stance.value}
                    poleNeg={issue.poleNeg}
                    polePos={issue.polePos}
                    entityLabel={issue.label}
                  />
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">basis:</span>{" "}
                    {stance.basis}
                    {billIds.length > 0 && (
                      <>
                        {" · "}
                        {billIds.length} {billIds.length === 1 ? "bill" : "bills"}
                        {": "}
                        <span className="text-muted-foreground">
                          {billIds.join(", ")}
                        </span>
                      </>
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </ProfileSection>

      <ProfileSection
        title="Voting record"
        icon={VoteIcon}
        description="Each row links to the underlying roll-call so any stance can be traced to the source."
      >
        {votes.length === 0 ? (
          <p className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            No roll-call votes are available for this candidate yet.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {votes.map((vote, i) => (
              <li key={`${vote.billId}-${i}`}>
                <VoteRow vote={vote} />
              </li>
            ))}
          </ul>
        )}
      </ProfileSection>
    </div>
  );
}
