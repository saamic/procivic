// Procivic — pure recommendation logic for the ballot spine (DESIGN.md §4.2; RUBRIC C1/C2).
//
// Every recommendation here is a deterministic CALCULATION over the USER's value vector vs.
// the standardized record — never an editorial opinion. The math lives in lib/scoring.ts
// (computeAlignment / computeConfidence / measureLean); this module only:
//   1. translates a measure's per-issue YES-positions into the shared `Stance[]` shape, and
//   2. turns an alignment result into a human-readable {label, alignment, confidence, why}.
// These functions are PURE (no React, no I/O beyond the static config/data accessors) so later
// slices (measure profiles, "Ask") can reuse them.

import type { BallotCandidateRace, BallotCandidate } from "@/lib/ballot";
import { getCandidate } from "@/lib/candidates";
import { MEASURES } from "@/config/measures";
import {
  computeAlignment,
  computeConfidence,
  measureLean,
} from "@/lib/scoring";
import { issueLabel } from "@/components/shared/IssueBadge";
import type { Stance, UserValues, AlignmentResult } from "@/lib/types";

/** Below this lean strength (distance from the 50 midpoint) we hedge: "Lean YES" / "Lean NO". */
const LEAN_HEDGE_STRENGTH = 20;

/** A decoded verdict for one ballot item — always derived, never editorial. */
export interface Recommendation {
  label: string;
  alignment: number;
  confidence: number;
  why: string;
}

/** A candidate-race recommendation also names which candidate it scored. */
export interface CandidateRecommendation extends Recommendation {
  candidateSlug: string;
}

/** True once the user has answered ≥1 issue (any importance>0 OR any stance set). */
function hasUserVector(user: UserValues): boolean {
  const anyImportance = Object.values(user.importance).some(
    (w) => typeof w === "number" && w > 0,
  );
  const anyStance = Object.values(user.stances).some(
    (s) => typeof s === "number",
  );
  return anyImportance || anyStance;
}

/**
 * The issue that drove this alignment most for THIS user: among the issues actually scored
 * (the item has a stance on it AND the user weighted it), the one with the largest weight.
 * Returns null when nothing was scored (so callers can fall back to a generic line).
 */
function topContributingIssueLabel(result: AlignmentResult): string | null {
  let top: AlignmentResult["perIssue"][number] | null = null;
  for (const entry of result.perIssue) {
    if (top === null || entry.weight > top.weight) top = entry;
  }
  return top ? issueLabel(top.issue) : null;
}

/**
 * Translate a measure's `yesPositions` into the shared `Stance[]`: for each tagged issue the
 * stance VALUE is the axis position a YES vote represents (`yesDirection`: +1 toward polePos,
 * -1 toward poleNeg), with basis "stated" (the measure text is the stated source). Returns []
 * for an unknown slug.
 */
export function measureStances(measureSlug: string): Stance[] {
  const measure = MEASURES.find((m) => m.slug === measureSlug);
  if (!measure) return [];
  return measure.yesPositions.map((pos) => ({
    issue: pos.issue,
    value: pos.yesDirection,
    basis: "stated" as const,
  }));
}

/**
 * Recommend YES/NO on a measure for this user. We score the alignment of the YES position,
 * then `measureLean` decides direction; strength < LEAN_HEDGE_STRENGTH hedges to "Lean …".
 * Confidence is the honest coverage/evidence/decisiveness blend from the engine. The `why`
 * names the user's most-weighted contributing issue — descriptive, not editorial.
 * Returns null when the user has no value vector (nothing to score against).
 */
export function recommendMeasure(
  measureSlug: string,
  user: UserValues,
): Recommendation | null {
  if (!hasUserVector(user)) return null;

  const stances = measureStances(measureSlug);
  const alignmentResult = computeAlignment(user, stances);
  const { alignment } = alignmentResult;
  const { lean, strength } = measureLean(alignment);
  const confidence = computeConfidence(user, stances, alignment).value;

  const hedged = strength < LEAN_HEDGE_STRENGTH;
  const label = hedged ? `Lean ${lean}` : lean;

  const topIssue = topContributingIssueLabel(alignmentResult);
  const why = topIssue
    ? `Matches your priority on ${topIssue.toLowerCase()}.`
    : "Scored against your values — you didn’t weight this measure’s issues, so this is a coin-flip.";

  return { label, alignment, confidence, why };
}

/**
 * The race's best SCORABLE candidate: one that `hasProfile` AND resolves to a candidate record
 * with ≥1 stance via `getCandidate`. (Today only Tier-1 Wiener qualifies; the rest are Tier-3
 * "labeled honestly" entries with no standardized record.) Returns null if none qualify.
 */
function findScorableCandidate(
  race: BallotCandidateRace,
): { ballotEntry: BallotCandidate; stances: Stance[] } | null {
  for (const ballotEntry of race.candidates) {
    if (!ballotEntry.hasProfile) continue;
    const record = getCandidate(ballotEntry.slug);
    if (record && record.stances.length > 0) {
      return { ballotEntry, stances: record.stances };
    }
  }
  return null;
}

/** The display surname for a candidate ("Scott Wiener" -> "Wiener"). */
function surnameOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 0 ? parts[parts.length - 1] : name;
}

/**
 * Recommend a candidate in a race for this user: score the race's best scorable candidate's
 * stances, label with that candidate's surname, and explain via the top contributing issue.
 * Returns null when the race has no scorable candidate (Tier-3 / no standardized data) or when
 * the user has no value vector — callers must then label the item honestly, never drop it.
 */
export function recommendCandidateRace(
  race: BallotCandidateRace,
  user: UserValues,
): CandidateRecommendation | null {
  if (!hasUserVector(user)) return null;

  const scorable = findScorableCandidate(race);
  if (!scorable) return null;

  const { ballotEntry, stances } = scorable;
  const alignmentResult = computeAlignment(user, stances);
  const { alignment } = alignmentResult;
  const confidence = computeConfidence(user, stances, alignment).value;

  const topIssue = topContributingIssueLabel(alignmentResult);
  const why = topIssue
    ? `Closest to you on ${topIssue.toLowerCase()}.`
    : "Scored against your values — weight some issues in the quiz to sharpen this.";

  return {
    label: surnameOf(ballotEntry.name),
    alignment,
    confidence,
    why,
    candidateSlug: ballotEntry.slug,
  };
}
