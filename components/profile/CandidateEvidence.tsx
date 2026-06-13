"use client";

import * as React from "react";
import Link from "next/link";
import { Scale, Gavel, Quote } from "lucide-react";
import type { Stance, Vote, Statement } from "@/lib/types";
import { ISSUES } from "@/config/issues";
import { ProfileSection } from "@/components/shared/ProfileShell";
import { IssueBadge } from "@/components/shared/IssueBadge";
import { SourceLink } from "@/components/shared/SourceLink";
import { StanceBar } from "@/components/shared/StanceBar";
import { VoteRow } from "@/components/shared/VoteRow";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { useUserValues } from "@/lib/userValues";
import { cn } from "@/lib/utils";

/** A small label for one part of the card (Voting history / Statement history). */
function PartLabel({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      <Icon className="h-3.5 w-3.5 text-brand-500" aria-hidden />
      {children}
    </span>
  );
}

/**
 * "How it aligns with you" — agreement bucket from the user vs. candidate stance,
 * paired with score-language token classes (aligns → brand, partial → accent,
 * differs → signal) following the ConfidenceBadge chip convention.
 */
function alignment(
  userStance: number,
  candidateStance: number
): { label: string; cls: string } {
  const agree = 1 - Math.abs(userStance - candidateStance) / 2;
  if (agree >= 0.66)
    return {
      label: "Aligns with you",
      cls: "bg-brand-100 text-brand-800 border-brand-200",
    };
  if (agree >= 0.4)
    return {
      label: "Partial overlap",
      cls: "bg-accent-100 text-accent-800 border-accent-200",
    };
  return {
    label: "Differs from you",
    cls: "bg-signal-100 text-signal-800 border-signal-200",
  };
}

/**
 * Tier-1 candidate evidence (DESIGN §11; RUBRIC D1/D2/G3): ONE rich per-issue section.
 * The collapsed header surfaces how the candidate's vote-derived stance ALIGNS with the
 * visitor — the agreement label plus a StanceBar comparing them — so the takeaway is
 * visible without expanding. Expanding reveals the underlying RECORD: the roll-call
 * voting history and any statement history, each carrying its source.
 */
export function CandidateEvidence({
  stances,
  votes,
  statements,
  statedStances,
  className,
}: {
  stances: Stance[];
  votes: Vote[];
  statements?: Statement[];
  statedStances?: Stance[];
  className?: string;
}) {
  void statedStances; // accepted for parity with the ingest shape; alignment uses the user vector.
  const { values, ready, hasVector } = useUserValues();

  // Preserve the canonical issue order from config, keeping only issues we have a stance for.
  const rows = ISSUES.map((issue) => {
    const stance = stances.find((s) => s.issue === issue.id);
    return stance ? { issue, stance } : null;
  }).filter(
    (row): row is { issue: (typeof ISSUES)[number]; stance: Stance } => row !== null
  );

  // The per-issue StanceBars share one key, shown once in the section header. It only
  // appears when the visitor's stance markers actually render below (i.e. they have a vector).
  const showSharedLegend =
    rows.length > 0 &&
    ready &&
    hasVector &&
    rows.some(({ issue }) => typeof values.stances[issue.id] === "number");

  return (
    <div className={className}>
      <ProfileSection
        title="Where they stand"
        icon={Scale}
        aside={
          showSharedLegend ? (
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-brand-500 bg-white" />
                You
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-accent-500" />
                Wiener
              </span>
            </div>
          ) : undefined
        }
      >
        {rows.length === 0 ? (
          <p className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            No vote-derived stances are available for this candidate yet.
          </p>
        ) : (
          <>
            <Accordion type="multiple" className="space-y-3">
              {rows.map(({ issue, stance }) => {
                const issueVotes = votes.filter((v) => v.issue === issue.id);
                const issueStatements =
                  statements?.filter((s) => s.issue === issue.id) ?? [];
                const userStance = values.stances[issue.id];
                const hasUserStance =
                  ready && hasVector && typeof userStance === "number";
                const agreement = hasUserStance
                  ? alignment(userStance, stance.value)
                  : null;

                return (
                  <AccordionItem
                    key={issue.id}
                    value={issue.id}
                    className="rounded-xl border border-border bg-card px-4 shadow-elev-1"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <span className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1.5 pr-3">
                        <IssueBadge issue={issue.id} />
                        {agreement ? (
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                              agreement.cls
                            )}
                          >
                            {agreement.label}
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-muted-foreground">
                            How it aligns with you
                          </span>
                        )}
                      </span>
                    </AccordionTrigger>

                    {/* Always-visible alignment readout — stays shown when collapsed. */}
                    <div className="pb-4">
                      {hasUserStance ? (
                        <StanceBar
                          value={stance.value}
                          compareValue={userStance}
                          poleNeg={issue.poleNeg}
                          polePos={issue.polePos}
                          entityLabel="Wiener"
                          compareLabel="You"
                          showLegend={false}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          <Link
                            href="/quiz"
                            className="font-medium text-brand-600 underline-offset-2 hover:text-brand-700 hover:underline"
                          >
                            Take the quiz
                          </Link>{" "}
                          to see how this aligns with you.
                        </p>
                      )}
                    </div>

                    <AccordionContent className="border-t border-border pt-3">
                      <div className="space-y-4">
                        {/* Voting history */}
                        <div className="space-y-2">
                          <PartLabel icon={Gavel}>Voting history</PartLabel>
                          {issueVotes.length > 0 ? (
                            <div className="space-y-2">
                              {issueVotes.map((vote) => (
                                <VoteRow
                                  key={`${vote.billId}-${vote.sourceUrl}`}
                                  vote={vote}
                                />
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No roll-call votes on record for this issue.
                            </p>
                          )}
                        </div>

                        {/* Statement history */}
                        {issueStatements.length > 0 && (
                          <div className="space-y-2">
                            <PartLabel icon={Quote}>Statement history</PartLabel>
                            <div className="space-y-2">
                              {issueStatements.map((statement, i) => (
                                <blockquote
                                  key={`${statement.sourceUrl}-${i}`}
                                  className="border-l-2 border-brand-200 pl-3 text-sm leading-snug text-foreground"
                                >
                                  &ldquo;{statement.text}&rdquo;{" "}
                                  <SourceLink
                                    href={statement.sourceUrl}
                                    className="align-baseline"
                                  >
                                    source
                                  </SourceLink>
                                </blockquote>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>

            <p className="mt-3 text-xs text-muted-foreground">
              These stances are derived from real CA State Senate roll-call votes; pole
              labels are neutral coordinates, not judgments.
            </p>
          </>
        )}
      </ProfileSection>
    </div>
  );
}
