"use client";

// Procivic — the ballot spine (DESIGN.md §4.2; RUBRIC C1/C2/C3). The whole product in one
// view: EVERY contest + measure on the June-2026 SF ballot, decoded against the user's values.
//
// Guarantees enforced here:
//   • C1 — nothing dropped: every ballot item renders a card; items with no standardized
//     record are labeled honestly (Tier-3 "data unavailable") instead of being hidden.
//   • C2 — every verdict is a CALCULATION (lib/recommend.ts over the user's vector), never an
//     editorial opinion. With no vector we show "take the quiz" placeholders, not guesses.
//   • C3 — every measure links to /measure/{slug}; every candidate-with-profile to
//     /candidate/{slug}.
// Brand tokens only (no hardcoded hex), responsive (no hardcoded element widths), SSR-safe via
// the `ready` guard from useUserValues().

import * as React from "react";
import Link from "next/link";
import { Sparkles, ScrollText, ArrowRight } from "lucide-react";

import { getBallot, type BallotItem } from "@/lib/ballot";
import { hasRace } from "@/lib/races";
import { MEASURES } from "@/config/measures";
import { useUserValues } from "@/lib/userValues";
import {
  measureStances,
  recommendMeasure,
  recommendCandidateRace,
  type Recommendation,
} from "@/lib/recommend";
import { computeAlignment, measureLean } from "@/lib/scoring";
import {
  BallotItemCard,
  type BallotItemRecommendation,
} from "@/components/shared/BallotItemCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserValues } from "@/lib/types";

/** Human-readable measure title: "Prop A — Earthquake Safety Bond". */
function measureTitle(measureSlug: string, code: string): string {
  const def = MEASURES.find((m) => m.slug === measureSlug);
  return def ? `Prop ${def.code} — ${def.shortTitle}` : `Prop ${code}`;
}

/** Map a recommendation to the card's recommendation prop (or undefined to show a placeholder). */
function toCardRecommendation(
  rec: Recommendation | null,
): BallotItemRecommendation | undefined {
  if (!rec) return undefined;
  return {
    label: rec.label,
    alignment: rec.alignment,
    confidence: rec.confidence,
  };
}

/**
 * Whether a single ballot item leans YES/NO (measures) or has a decoded pick (races), used only
 * for the "at a glance" tally. Returns null for items we can't decode (no data / no vector).
 */
function itemLean(
  item: BallotItem,
  user: UserValues,
): "YES" | "NO" | "pick" | null {
  if (item.kind === "measure") {
    const stances = measureStances(item.measureSlug);
    const { alignment } = computeAlignment(user, stances);
    return measureLean(alignment).lean;
  }
  return recommendCandidateRace(item, user) ? "pick" : null;
}

/**
 * Display-order rank for a ballot item (DESIGN intent: marquee race → measures → down-ballot).
 * Lower sorts first: the CA-11 marquee race (0), then all measures (1), then the remaining
 * Tier-3 candidate races (2). Used with a STABLE sort so original order is preserved within
 * each group and nothing is dropped (RUBRIC C1). Canonical enumeration stays in data/ballot.json.
 */
function displayRank(item: BallotItem): number {
  if (item.id === "us-house-ca11") return 0;
  if (item.kind === "measure") return 1;
  return 2;
}

export default function BallotClient() {
  const ballot = getBallot();
  const { values, ready, hasVector } = useUserValues();

  // Stable display order: marquee race → measures → down-ballot races. Array#sort is stable in
  // modern engines, so items within a rank keep their data/ballot.json order. Counts/tally below
  // are order-independent, so they continue to read from ballot.items.
  const orderedItems = [...ballot.items].sort(
    (a, b) => displayRank(a) - displayRank(b),
  );

  // SSR / pre-hydration: stable skeleton so recommendations never flash a wrong (empty-vector)
  // verdict before localStorage loads.
  if (!ready) {
    return (
      <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-6 sm:py-14">
        <div className="space-y-3">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
        </div>
        <div className="mt-8 space-y-3">
          {ballot.items.map((item) => (
            <Skeleton key={item.id} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      </main>
    );
  }

  const measureCount = ballot.items.filter((i) => i.kind === "measure").length;
  const contestCount = ballot.items.length - measureCount;

  // "At a glance" tally — only meaningful once the user has a vector.
  const yesCount = hasVector
    ? ballot.items.filter((i) => itemLean(i, values) === "YES").length
    : 0;
  const noCount = hasVector
    ? ballot.items.filter((i) => itemLean(i, values) === "NO").length
    : 0;
  const pickCount = hasVector
    ? ballot.items.filter((i) => itemLean(i, values) === "pick").length
    : 0;

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-6 sm:py-14">
      <header>
        <p className="text-sm font-medium text-muted-foreground">
          {ballot.jurisdiction}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          {ballot.title}
        </h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
          <ScrollText className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            {contestCount} {contestCount === 1 ? "contest" : "contests"} ·{" "}
            {measureCount} measures ·{" "}
            {hasVector
              ? "your ballot, decoded"
              : "take the quiz to decode it"}
          </span>
        </p>
      </header>

      {!hasVector ? (
        <Link
          href="/quiz"
          className="group focus-ring mt-6 flex items-center gap-4 rounded-xl bg-gradient-decoded p-5 text-white shadow-glow transition-transform hover:-translate-y-0.5"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white/20">
            <Sparkles className="h-6 w-6" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">
              Take the 60-second quiz to decode your ballot
            </span>
            <span className="block text-sm text-white/80">
              See a YES/NO or a pick on every contest — scored against your own
              values.
            </span>
          </span>
          <ArrowRight
            className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      ) : (
        <div
          className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-brand-100 bg-brand-50/70 px-4 py-3 text-sm text-brand-900"
          role="status"
        >
          <Sparkles className="h-4 w-4 shrink-0 text-brand-500" aria-hidden />
          <span>
            At a glance: {pickCount} {pickCount === 1 ? "pick" : "picks"} ·{" "}
            {yesCount} leaning YES · {noCount} leaning NO. Open any item for the
            receipts.
          </span>
        </div>
      )}

      <ol className="mt-8 space-y-3">
        {orderedItems.map((item) => {
          if (item.kind === "measure") {
            const rec = recommendMeasure(item.measureSlug, values);
            return (
              <li key={item.id}>
                <BallotItemCard
                  variant="measure"
                  title={measureTitle(item.measureSlug, item.code)}
                  href={`/measure/${item.measureSlug}`}
                  recommendation={toCardRecommendation(rec)}
                  why={rec?.why}
                />
              </li>
            );
          }

          // Candidate race. Decode against the best scorable candidate, if any.
          const rec = recommendCandidateRace(item, values);

          // A race with its own page (the full candidate field) links to /race/{id} rather than
          // straight to one candidate (e.g. CA-11 → the race page, not just Wiener). Races
          // without a race page keep linking to the relevant candidate profile, unchanged.
          const hasRacePage = hasRace(item.id);

          if (rec) {
            // A scorable candidate exists (e.g. Tier-1 Wiener) — link to the race page if one
            // exists, else to that candidate's profile (C3).
            return (
              <li key={item.id}>
                <BallotItemCard
                  variant="candidate"
                  title={item.office}
                  subtitle={item.subtitle}
                  href={
                    hasRacePage ? `/race/${item.id}` : `/candidate/${rec.candidateSlug}`
                  }
                  recommendation={toCardRecommendation(rec)}
                  why={rec.why}
                />
              </li>
            );
          }

          // No scorable recommendation. Two honest sub-cases — never silently dropped (C1):
          //   • the race HAS a profiled/deep-record candidate (e.g. Tier-1 Wiener): we can't
          //     yet show a decoded pick (no user vector), but it is NOT "data unavailable" —
          //     link the card to that candidate's profile, label by their tier, and show the
          //     card's built-in "Take the quiz to decode" placeholder (recommendation omitted).
          //   • the whole race is Tier-3 with no profiled candidate: keep the honest
          //     `dataUnavailable` + "Tier 3" labeling.
          const profiled = item.candidates.find((c) => c.hasProfile);

          if (profiled) {
            const tierLabel =
              profiled.tier === 1
                ? "Tier 1 · deep record"
                : `Tier ${profiled.tier} · funding/positions only`;
            return (
              <li key={item.id}>
                <BallotItemCard
                  variant="candidate"
                  title={item.office}
                  subtitle={item.subtitle}
                  href={
                    hasRacePage ? `/race/${item.id}` : `/candidate/${profiled.slug}`
                  }
                  tierLabel={tierLabel}
                  why="Deep voting + funding record — take the quiz to see your match."
                />
              </li>
            );
          }

          const why = hasVector
            ? "Standardized record not available — labeled honestly."
            : "Standardized record not available for this race — labeled honestly.";

          return (
            <li key={item.id}>
              <BallotItemCard
                variant="candidate"
                title={item.office}
                subtitle={item.subtitle}
                href="/ballot"
                tierLabel="Tier 3 · funding/positions only"
                dataUnavailable
                why={why}
              />
            </li>
          );
        })}
      </ol>
    </main>
  );
}
