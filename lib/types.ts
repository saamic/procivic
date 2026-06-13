// Procivic shared domain types (DESIGN.md §6). The ingest workflow writes /data JSON in
// these shapes; the app + scoring engine read them. Issue/Measure config types live in
// config/*.ts and are imported where needed.

import type { IssueId } from "@/config/issues";

export type EvidenceBasis = "votes" | "stated" | "funding";
export type DataTier = 1 | 2 | 3;

/** A single roll-call vote, tagged to an issue axis. */
export interface Vote {
  billId: string;
  title: string;
  date?: string;
  position: "Yea" | "Nay" | "Present" | "NotVoting" | string;
  /** Does a Yea move toward poleNeg(-1) or polePos(+1)? */
  direction: -1 | 1;
  issue: IssueId;
  sourceUrl: string;
}

/** A standardized stance on one issue axis, with its evidence basis. */
export interface Stance {
  issue: IssueId;
  value: number; // -1..+1
  basis: EvidenceBasis;
  derivedFrom?: string[]; // bill/source ids
}

/** A stated position (campaign site etc.) — used for the consistency receipt. */
export interface Statement {
  issue: IssueId;
  text: string;
  sourceUrl: string;
}

export interface Donor {
  name: string;
  amount: number;
  employer?: string;
  kind?: "donor" | "pac" | "industry" | "committee";
}

export interface CandidateFunding {
  total: number;
  topDonors: Donor[];
  sourceUrl: string;
}

export interface FundingNode {
  id: string;
  label: string;
  kind: "donor" | "pac" | "industry" | "committee" | "candidate" | "side";
}
export interface FundingEdge {
  from: string;
  to: string;
  amount: number;
  side?: "support" | "oppose";
  sourceUrl?: string;
}

export interface Candidate {
  slug: string;
  name: string;
  party: string;
  office: string;
  incumbent?: boolean;
  tier?: DataTier;
  photoUrl?: string;
  identity?: { party: string; office: string };
  stances: Stance[];
  votes: Vote[];
  funding: CandidateFunding;
  statements?: Statement[];
  consistency?: Score;
  transparency?: Score;
  dataNote?: string; // honest label when data is partial (Tier 3)
}

export interface CommitteeFunding {
  committee: string;
  amount: number;
  sourceUrl?: string;
}

export interface Measure {
  slug: string;
  code: string;
  title: string;
  plainSummary: string;
  sourceUrls: string[];
  funding: {
    support: CommitteeFunding[];
    oppose: CommitteeFunding[];
    sourceUrl: string;
  };
}

/** A generic 0..100 score with its inputs surfaced (no black box — RUBRIC G2/G3). */
export interface Score {
  value: number; // 0..100
  inputs?: { label: string; value: number | string }[];
  sourceUrls?: string[];
}

/** The user's stored value vector (localStorage). */
export interface UserValues {
  stances: Partial<Record<IssueId, number>>; // -1..+1
  importance: Partial<Record<IssueId, number>>; // 0..1
  nuance?: Partial<
    Record<
      IssueId,
      { refinements?: Record<string, number>; note?: string }
    >
  >;
  updatedAt: string;
}

/** Output of the alignment computation for one item (DESIGN §8.1). */
export interface AlignmentResult {
  alignment: number; // 0..100
  perIssue: {
    issue: IssueId;
    agree: number; // 0..1
    weight: number;
    userStance: number;
    itemStance: number;
  }[];
}

export interface ConfidenceResult {
  value: number; // 0..100
  bucket: "High" | "Med" | "Low";
  coverage: number; // 0..1
  evidenceStrength: number; // 0..1
  decisiveness: number; // 0..1
}
