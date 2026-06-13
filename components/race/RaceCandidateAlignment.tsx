"use client";

// Procivic — per-candidate alignment chip for the race page (DESIGN §8.1; RUBRIC C2).
//
// Decodes the user's stored value vector against ONE candidate's standardized stances. The
// verdict (a RecommendationPill labeled with the candidate's surname) is a pure calculation
// over the user's values vs. the candidate's vote-derived record — never Procivic's opinion.
// Only rendered for candidates that actually have a standardized record; everyone else is
// labeled honestly upstream, never scored. SSR-safe via the `ready` guard.

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getCandidate } from "@/lib/candidates";
import { useUserValues } from "@/lib/userValues";
import { computeAlignment, computeConfidence } from "@/lib/scoring";
import { RecommendationPill } from "@/components/shared/RecommendationPill";
import { Skeleton } from "@/components/ui/skeleton";

/** The display surname for a candidate ("Scott Wiener" -> "Wiener"). */
function surnameOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 0 ? parts[parts.length - 1] : name;
}

export function RaceCandidateAlignment({ slug }: { slug: string }) {
  const { values, ready, hasVector } = useUserValues();

  const candidate = getCandidate(slug);
  // No standardized record to score against — render nothing (the row labels this honestly).
  if (!candidate || candidate.stances.length === 0) return null;

  // Pre-hydration: a tiny skeleton so SSR and the first client render agree (no flash).
  if (!ready) {
    return <Skeleton className="h-8 w-44 rounded-full" />;
  }

  // No value vector yet: invite the quiz rather than fabricate an alignment.
  if (!hasVector) {
    return (
      <Link
        href="/quiz"
        className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-gradient-decoded px-3.5 py-1.5 text-xs font-semibold text-white shadow-glow transition-opacity hover:opacity-90"
      >
        Take the quiz to see your alignment
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    );
  }

  const { alignment } = computeAlignment(values, candidate.stances);
  const confidence = computeConfidence(values, candidate.stances, alignment).value;

  return (
    <RecommendationPill
      recommendation={surnameOf(candidate.name)}
      alignment={alignment}
      confidence={confidence}
      size="sm"
    />
  );
}
