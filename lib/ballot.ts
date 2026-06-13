// Typed accessor over the enumerated June-2026 SF (CA-11) ballot (DESIGN.md §6). Lists every
// contest + measure — nothing silently dropped (RUBRIC C1); items with no standardized data
// carry tier 3 / hasProfile:false so the UI can label them honestly.

import ballot from "@/data/ballot.json";

export interface BallotCandidate {
  slug: string;
  name: string;
  party: string;
  tier: number;
  hasProfile: boolean;
  advanced?: boolean;
  note?: string;
  isFieldNote?: boolean;
}

export interface BallotCandidateRace {
  kind: "candidateRace";
  id: string;
  office: string;
  subtitle?: string;
  dataTier: number;
  note?: string;
  candidates: BallotCandidate[];
}

export interface BallotMeasureItem {
  kind: "measure";
  id: string;
  measureSlug: string;
  code: string;
  dataTier: number;
}

export type BallotItem = BallotCandidateRace | BallotMeasureItem;

export interface Ballot {
  id: string;
  jurisdiction: string;
  date: string;
  title: string;
  sourceUrls: string[];
  items: BallotItem[];
}

export function getBallot(): Ballot {
  return ballot as Ballot;
}
