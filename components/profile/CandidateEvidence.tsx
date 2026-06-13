"use client";

import * as React from "react";
import Link from "next/link";
import { Scale, Quote, Gavel, Compass, Users } from "lucide-react";
import type { Stance, Vote, Statement } from "@/lib/types";
import type { Issue } from "@/config/issues";
import { ISSUES } from "@/config/issues";
import { ProfileSection } from "@/components/shared/ProfileShell";
import { IssueBadge } from "@/components/shared/IssueBadge";
import { SourceLink } from "@/components/shared/SourceLink";
import { StanceBar } from "@/components/shared/StanceBar";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { useUserValues } from "@/lib/userValues";
import { cn } from "@/lib/utils";

/**
 * Derive a concise, plain-language reading of a vote-derived stance value in [-1, 1].
 * The pole is the descriptive coordinate the candidate leans toward (NOT a value
 * judgment); strength buckets keep the readout scannable.
 */
function describeStance(v: number, issue: Issue): string {
  const mag = Math.abs(v);
  const pole = v > 0 ? issue.polePos : issue.poleNeg;
  if (mag >= 0.66) return `Strongly favors: ${pole}`;
  if (mag >= 0.25) return `Leans: ${pole}`;
  return "Mixed / no clear lean";
}

/** A small label for one part of the card (Said / Voted / What it means / How it aligns). */
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
 * Tier-1 candidate evidence (DESIGN §11; RUBRIC D1/D2/G3): ONE rich per-issue section that
 * merges what the candidate SAID with how they VOTED, the plain-language meaning of the
 * vote-derived stance, and how that stance aligns with the visitor's own values. Every
 * factual claim carries its source; the alignment readout requires the client value vector.
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

  return (
    <div className={className}>
      <ProfileSection title="Where they stand" icon={Scale}>
        {rows.length === 0 ? (
          <p className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            No vote-derived stances are available for this candidate yet.
          </p>
        ) : (
          <>
            <Accordion type="multiple" className="space-y-3">
              {rows.map(({ issue, stance }) => {
                const statement = statements?.find((s) => s.issue === issue.id);
                const vote = votes.find((v) => v.issue === issue.id);
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
                            Take the quiz to compare
                          </span>
                        )}
                      </span>
                    </AccordionTrigger>

                    <AccordionContent>
                      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                        {/* Said */}
                        <div className="space-y-1">
                          <PartLabel icon={Quote}>Said</PartLabel>
                          {statement ? (
                            <p className="text-sm leading-snug text-foreground">
                              &ldquo;{statement.text}&rdquo;{" "}
                              <SourceLink href={statement.sourceUrl} className="align-baseline">
                                source
                              </SourceLink>
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No public statement on record.
                            </p>
                          )}
                        </div>

                        {/* Voted */}
                        <div className="space-y-1">
                          <PartLabel icon={Gavel}>Voted</PartLabel>
                          {vote ? (
                            <p className="text-sm leading-snug text-foreground">
                              <span className="font-medium">{vote.position}</span> on{" "}
                              {vote.billId} — {vote.title}{" "}
                              <SourceLink href={vote.sourceUrl} className="align-baseline">
                                roll-call
                              </SourceLink>
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No roll-call vote on record.
                            </p>
                          )}
                        </div>

                        {/* What it means */}
                        <div className="space-y-1">
                          <PartLabel icon={Compass}>What it means</PartLabel>
                          <p className="text-sm leading-snug text-foreground">
                            {describeStance(stance.value, issue)}
                          </p>
                        </div>

                        {/* How it aligns with you */}
                        <div className="space-y-1.5">
                          <PartLabel icon={Users}>How it aligns with you</PartLabel>
                          {hasUserStance ? (
                            <StanceBar
                              value={stance.value}
                              compareValue={userStance}
                              poleNeg={issue.poleNeg}
                              polePos={issue.polePos}
                              entityLabel="Wiener"
                              compareLabel="You"
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
