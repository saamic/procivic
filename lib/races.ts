// Typed accessor over the static /data race store (precompute-and-verify: the app reads this
// JSON, never a live FEC API at request time — DESIGN.md §5.1). A "race" is a single contest
// rendered as its own page (the full field of candidates + their FEC funding), as opposed to a
// single candidate profile. Today only the CA-11 open-seat race qualifies.

import ca11 from "@/data/races/us-house-ca11.json";

/** A candidate within a race, as stored in /data/races/*.json. */
export interface RaceCandidate {
  slug: string;
  name: string;
  party: string;
  advanced: boolean;
  hasProfile: boolean;
  tier: number;
  fecCandidateId: string | null;
  funding: { total: number; sourceUrl: string } | null;
}

/** A single contest with its full candidate field — rendered at /race/{id}. */
export interface Race {
  id: string;
  office: string;
  subtitle: string;
  sourceUrl: string;
  candidates: RaceCandidate[];
}

// The ingest JSON is structurally a Race; cast once here so callers stay typed.
const RACES: Record<string, Race> = {
  "us-house-ca11": ca11 as unknown as Race,
};

export function getRace(id: string): Race | null {
  return RACES[id] ?? null;
}

export function listRaceIds(): string[] {
  return Object.keys(RACES);
}

export function hasRace(id: string): boolean {
  return id in RACES;
}
