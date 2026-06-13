// Procivic — deterministic scoring engine (DESIGN.md §8.1). PURE functions only: no I/O,
// no React, no randomness — same inputs always produce the same outputs.
//
// CRITICAL (RUBRIC G4 — no hidden weighting): EVERY weight, coefficient, and threshold is
// read from config/scoring.config.ts (the `SCORING` object + `ISSUE_BASE_WEIGHT`). There are
// NO magic numbers in this file. The methodology page renders the same config, so what the
// user sees is exactly what the math uses.

import { SCORING, ISSUE_BASE_WEIGHT } from "@/config/scoring.config";
import type { IssueId } from "@/config/issues";
import type {
  UserValues,
  Stance,
  Statement,
  Score,
  AlignmentResult,
  ConfidenceResult,
  EvidenceBasis,
} from "./types";
import { clamp } from "./utils";

/**
 * ALIGNMENT (user <-> item), 0..100 (DESIGN.md §8.1; SCORING.alignment).
 *
 * For each issue the item has a stance on AND the user weighted (importance > 0):
 *   agree_i = 1 - |u_i - stance_i| / 2   (identical -> 1, opposite -> 0; both clamped to [-1,1])
 *   w_i     = user.importance[i]         (0..1)
 *   alignment = 100 * sum(w_i * agree_i) / sum(w_i)
 *
 * `ISSUE_BASE_WEIGHT` (all 1 by default) is applied as a per-issue multiplier so the
 * methodology page can prove no issue is secretly up/down-weighted; the user's importance
 * remains the real lever (config/scoring.config.ts). If the denominator is 0 (the user
 * weighted nothing the item has a stance on) alignment is the neutral 50 and perIssue = [].
 */
export function computeAlignment(
  user: UserValues,
  stances: Stance[],
): AlignmentResult {
  const perIssue: AlignmentResult["perIssue"] = [];
  let weightedAgree = 0;
  let weightSum = 0;

  for (const stance of stances) {
    const importance = user.importance[stance.issue];
    // Issues the user didn't answer (no importance, or 0) contribute weight 0 -> skip.
    if (importance === undefined || importance <= 0) continue;

    const userStanceRaw = user.stances[stance.issue];
    if (userStanceRaw === undefined) continue;

    const u = clamp(userStanceRaw, -1, 1);
    const itemStance = clamp(stance.value, -1, 1);

    // Distance-based agreement on a neutral [-1,1] axis (pole labels are irrelevant).
    const agree = 1 - Math.abs(u - itemStance) / 2;

    // base weight (config) * user importance (the real lever).
    const w = ISSUE_BASE_WEIGHT[stance.issue] * importance;

    weightedAgree += w * agree;
    weightSum += w;

    perIssue.push({
      issue: stance.issue,
      agree,
      weight: w,
      userStance: u,
      itemStance,
    });
  }

  if (weightSum === 0) {
    return { alignment: 50, perIssue: [] };
  }

  return { alignment: 100 * (weightedAgree / weightSum), perIssue };
}

/**
 * CONFIDENCE, 0..100 -> High/Med/Low (DESIGN.md §8.1; SCORING.confidence + evidenceWeight).
 * An honest reflection of how much we actually know about this match:
 *   coverage         = sum(w_i over issues the item HAS a stance on)
 *                      / sum(w_i over ALL issues the user cares about, importance > 0)
 *   evidenceStrength = avg SCORING.evidenceWeight[basis] over the stances actually used
 *                      (those on issues the user cares about); 0 if none
 *   decisiveness     = |alignment - 50| / 50
 *   value            = 100 * (cCoverage*coverage + cEvidence*evidenceStrength + cDecisive*decisiveness)
 *   bucket           = High if value >= highMin, Med if >= medMin, else Low
 * Coverage is 0 if the user cares about nothing.
 */
export function computeConfidence(
  user: UserValues,
  stances: Stance[],
  alignment: number,
): ConfidenceResult {
  const { cCoverage, cEvidence, cDecisive, highMin, medMin } =
    SCORING.confidence;

  // Total weight the user cares about (importance > 0) — the coverage denominator.
  let totalCaredWeight = 0;
  for (const issueId of Object.keys(user.importance) as IssueId[]) {
    const importance = user.importance[issueId];
    if (importance === undefined || importance <= 0) continue;
    totalCaredWeight += ISSUE_BASE_WEIGHT[issueId] * importance;
  }

  // Weight + evidence over the stances the user cares about that the item has a position on.
  let coveredWeight = 0;
  let evidenceSum = 0;
  let evidenceCount = 0;
  for (const stance of stances) {
    const importance = user.importance[stance.issue];
    if (importance === undefined || importance <= 0) continue;
    coveredWeight += ISSUE_BASE_WEIGHT[stance.issue] * importance;
    evidenceSum += SCORING.evidenceWeight[stance.basis as EvidenceBasis];
    evidenceCount += 1;
  }

  const coverage = totalCaredWeight === 0 ? 0 : coveredWeight / totalCaredWeight;
  const evidenceStrength = evidenceCount === 0 ? 0 : evidenceSum / evidenceCount;
  const decisiveness = Math.abs(alignment - 50) / 50;

  const value =
    100 *
    (cCoverage * coverage + cEvidence * evidenceStrength + cDecisive * decisiveness);

  const bucket: ConfidenceResult["bucket"] =
    value >= highMin ? "High" : value >= medMin ? "Med" : "Low";

  return { value, bucket, coverage, evidenceStrength, decisiveness };
}

/**
 * MEASURE LEAN (DESIGN.md §8.1; SCORING.alignment.leanThreshold). Given the alignment of the
 * YES position, decide whether YES or NO fits the user's values. `strength` = distance from
 * the 50 midpoint (how far from a coin-flip), independent of direction.
 */
export function measureLean(alignment: number): {
  lean: "YES" | "NO";
  strength: number;
} {
  const lean: "YES" | "NO" =
    alignment >= SCORING.alignment.leanThreshold ? "YES" : "NO";
  return { lean, strength: Math.abs(alignment - 50) };
}

/**
 * CONSISTENCY (Tier-1 candidate), 0..100 (DESIGN.md §8.1; SCORING.consistency.tolerance).
 *
 * Compares what a candidate SAYS (stated stances) against what their VOTES imply, over issues
 * present in BOTH sets. To stay fully deterministic we do NOT infer sentiment from free text:
 * the caller supplies precomputed numeric `statedStances` (hence the revised signature —
 * `statedStances` instead of raw `Statement[]`). For each shared issue we compare the stated
 * value s_i to the vote-derived value c_i: it counts as consistent if |s_i - c_i| <= tolerance
 * OR sign(s_i) === sign(c_i).
 *   value   = 100 * consistentCount / comparedCount   (0 if no issues compared)
 *   receipt = the issue with the LARGEST |s_i - c_i| among issues whose signs DIFFER
 *             (undefined if there is no sign disagreement)
 * Comparison counts are surfaced in Score.inputs (RUBRIC G2/G3 — no black box).
 *
 * NOTE: `Statement[]` (free campaign text) is the source the caller turns into `statedStances`;
 * it is intentionally not parsed here so the engine stays deterministic and value-judgment-free.
 */
export function computeConsistency(
  statedStances: Stance[],
  voteStances: Stance[],
): Score & { receipt?: { issue: string; gap: number } } {
  // Latest vote-derived stance per issue (deterministic: last wins for duplicates).
  const voteByIssue = new Map<IssueId, number>();
  for (const v of voteStances) {
    voteByIssue.set(v.issue, clamp(v.value, -1, 1));
  }

  // sign() treated as 0 -> +1 so a neutral stated/vote value still has a stable, comparable sign.
  const signOf = (n: number): number => (n < 0 ? -1 : 1);

  let comparedCount = 0;
  let consistentCount = 0;
  let receipt: { issue: string; gap: number } | undefined;

  for (const stated of statedStances) {
    if (!voteByIssue.has(stated.issue)) continue; // only issues present in BOTH
    const s = clamp(stated.value, -1, 1);
    const c = voteByIssue.get(stated.issue)!;

    comparedCount += 1;
    const gap = Math.abs(s - c);
    const sameSign = signOf(s) === signOf(c);

    if (gap <= SCORING.consistency.tolerance || sameSign) {
      consistentCount += 1;
    }

    // Receipt = the worst opposite-sign contradiction (largest gap where signs differ).
    if (!sameSign && (receipt === undefined || gap > receipt.gap)) {
      receipt = { issue: stated.issue, gap };
    }
  }

  const value = comparedCount === 0 ? 0 : 100 * (consistentCount / comparedCount);

  return {
    value,
    inputs: [
      { label: "Issues compared", value: comparedCount },
      { label: "Consistent", value: consistentCount },
    ],
    receipt,
  };
}

/**
 * TRANSPARENCY (Tier-1 candidate), 0..100 (DESIGN.md §8.1; SCORING.transparency.weights).
 * Weighted composite of three 0..1 components:
 *   value = 100 * sum(weight_k * component_k)
 * Each component is surfaced (as a 0..100 percentage) in Score.inputs so the UI can show
 * them individually rather than as a single opaque number (RUBRIC G3).
 */
export function computeTransparency(components: {
  attendance: number;
  filingTimeliness: number;
  disclosure: number;
}): Score {
  const { weights } = SCORING.transparency;

  const attendance = clamp(components.attendance, 0, 1);
  const filingTimeliness = clamp(components.filingTimeliness, 0, 1);
  const disclosure = clamp(components.disclosure, 0, 1);

  const value =
    100 *
    (weights.attendance * attendance +
      weights.filingTimeliness * filingTimeliness +
      weights.disclosure * disclosure);

  return {
    value,
    inputs: [
      { label: "Attendance", value: 100 * attendance },
      { label: "Filing timeliness", value: 100 * filingTimeliness },
      { label: "Disclosure", value: 100 * disclosure },
    ],
  };
}
