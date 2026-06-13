// Typed accessor over the static /data measure store (precompute-and-verify; DESIGN §5.1).
// Shape mirrors what the ingest workflow wrote (richer than the lib/types Measure sketch):
// carries shortTitle/subject, yesPositions, per-committee topDonors, and the election result.
// Recommendation logic reads yesPositions from config/measures.ts (the canonical source);
// this loader supplies the summary, funding, and result the profile pages render.

import propA from "@/data/measures/prop-a-earthquake-bond.json";
import propB from "@/data/measures/prop-b-term-limits.json";
import propC from "@/data/measures/prop-c-small-business-tax-cuts.json";
import propD from "@/data/measures/prop-d-business-tax.json";

export interface MeasureCommittee {
  committee: string;
  amount: number;
  side?: string;
  filerNid?: string;
  fppcId?: string;
  sourceUrl?: string;
  topDonors?: { name: string; amount: number }[];
}

export interface MeasureResult {
  outcome: string;
  yesPct: number;
  noPct: number;
  yesVotes?: number;
  noVotes?: number;
  totalValidVotes?: number;
  sourceUrl: string;
}

export interface MeasureData {
  slug: string;
  code: string;
  title: string;
  shortTitle: string;
  subject?: string;
  plainSummary: string;
  sourceUrls: string[];
  yesPositions?: { issue: string; yesDirection: number; weight: number; rationale?: string }[];
  funding: {
    support: MeasureCommittee[];
    oppose: MeasureCommittee[];
    sourceUrl: string;
    notes?: string;
    asOf?: string;
  };
  result?: MeasureResult;
  dataTier: number;
}

const MEASURES_DATA: Record<string, MeasureData> = {
  "prop-a-earthquake-bond": propA as unknown as MeasureData,
  "prop-b-term-limits": propB as unknown as MeasureData,
  "prop-c-small-business-tax-cuts": propC as unknown as MeasureData,
  "prop-d-business-tax": propD as unknown as MeasureData,
};

export function getMeasure(slug: string): MeasureData | null {
  return MEASURES_DATA[slug] ?? null;
}

export function listMeasureSlugs(): string[] {
  return Object.keys(MEASURES_DATA);
}
