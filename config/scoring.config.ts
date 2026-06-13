// Procivic — scoring configuration. ALL weighting lives here (DESIGN.md §8.1, §16): the
// methodology page renders these values so there is no hidden/editorial weighting (RUBRIC G4).
// The scoring ENGINE (pure functions) is implemented by the build in lib/scoring.ts and must
// read every weight/threshold from this file.

import type { IssueId } from './issues';

export const SCORING = {
  /** Maps the quiz's "how much do you care" control to an importance weight. */
  importanceLevels: { none: 0, low: 0.25, med: 0.5, high: 1 } as const,

  /**
   * ALIGNMENT (user <-> item), 0..100.
   *   per-issue: agree_i = 1 - |u_i - stance_i| / 2        (identical -> 1, opposite -> 0)
   *   alignment = 100 * sum(w_i * agree_i) / sum(w_i)      over issues the item has a stance on
   *   (w_i = the user's importance weight for issue i)
   * Measures: compute alignment of the YES position; >=50 -> lean YES, else NO; strength = |a-50|.
   */
  alignment: {
    leanThreshold: 50, // measure: >= -> YES
  },

  /**
   * CONFIDENCE, 0..100 -> High/Med/Low. Honest reflection of how much we know.
   *   coverage         = sum(w_i over issues the item HAS evidence on) / sum(w_i over all the user cares about)
   *   evidenceStrength = avg evidenceWeight over the issues actually used
   *   decisiveness     = |alignment - 50| / 50
   *   confidence = 100 * (cCoverage*coverage + cEvidence*evidenceStrength + cDecisive*decisiveness)
   */
  confidence: {
    cCoverage: 0.5,
    cEvidence: 0.3,
    cDecisive: 0.2,
    highMin: 70, // >= 70 -> High
    medMin: 40, //  40..69 -> Med, < 40 -> Low
  },

  /** Evidence quality by basis (drives evidenceStrength + which stances we trust). */
  evidenceWeight: { votes: 1.0, funding: 0.7, stated: 0.6 } as const,

  /**
   * CONSISTENCY (Tier-1 candidate), 0..100: over issues with BOTH a stated position s_i and a
   * vote-derived c_i, the fraction where they agree in sign within `tolerance`. The "receipt"
   * is the issue with the largest opposite-sign gap.
   */
  consistency: {
    tolerance: 0.25, // |s_i - c_i| band still counted as "consistent"
  },

  /**
   * TRANSPARENCY (Tier-1 candidate), 0..100: weighted composite, each component shown
   * individually in the UI (RUBRIC G3). Components are each 0..1 before weighting.
   */
  transparency: {
    weights: { attendance: 0.4, filingTimeliness: 0.3, disclosure: 0.3 },
  },
} as const;

/**
 * Per-issue base weights. Default 1 (equal); the USER's importance is the real lever.
 * Left here so the methodology page can show that no issue is secretly up/down-weighted.
 */
export const ISSUE_BASE_WEIGHT: Record<IssueId, number> = {
  housing: 1,
  homelessness_safety: 1,
  business_tax: 1,
  inequality_labor: 1,
  city_fiscal: 1,
  govt_reform: 1,
  climate: 1,
  healthcare: 1,
  immigration: 1,
  civil_democracy: 1,
};
