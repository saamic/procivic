// Typed accessors over the static /data candidate store (precompute-and-verify: the app
// reads this JSON, never a live source API at request time — DESIGN.md §5.1).

import wiener from "@/data/candidates/scott-wiener.json";
import type { Candidate } from "@/lib/types";

// The ingest JSON is structurally a Candidate (identity/stances/votes/funding/statements).
const CANDIDATES: Record<string, Candidate> = {
  "scott-wiener": wiener as unknown as Candidate,
};

export function getCandidate(slug: string): Candidate | null {
  return CANDIDATES[slug] ?? null;
}

export function listCandidateSlugs(): string[] {
  return Object.keys(CANDIDATES);
}
