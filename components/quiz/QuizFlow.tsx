"use client";

// Procivic — the onboarding quiz (DESIGN.md §9; RUBRIC B1, B2, G1).
//
// For each of the 10 ISSUES we elicit two things: a STANCE on a neutral [-1,+1] axis
// (a Slider) and an IMPORTANCE weight (None/Low/Med/High -> SCORING.importanceLevels).
// Both write through the useUserValues() contract and are read back from `values`, so
// the controls are fully controlled reflections of the persisted vector.
//
// Everything re-scores live (B2 + G1): the preview panel recomputes alignment +
// confidence against Scott Wiener's public record on EVERY answer change. Because the
// preview reads `values` (which changes identity on every setStance/setImportance) and
// the math is pure, a single useMemo keyed on `values` is enough to move the numbers.

import * as React from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw, Sparkles } from "lucide-react";

import { ISSUES } from "@/config/issues";
import { SCORING } from "@/config/scoring.config";
import { useUserValues } from "@/lib/userValues";
import { getCandidate } from "@/lib/candidates";
import {
  computeAlignment,
  computeConfidence,
  measureLean,
} from "@/lib/scoring";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IssueBadge } from "@/components/shared/IssueBadge";
import { ScoreChip } from "@/components/shared/ScoreChip";
import { ConfidenceBadge } from "@/components/shared/ConfidenceBadge";

/** Importance buttons, in order, mapped to the config weights (no magic numbers). */
const IMPORTANCE_OPTIONS: { label: string; value: number }[] = [
  { label: "None", value: SCORING.importanceLevels.none },
  { label: "Low", value: SCORING.importanceLevels.low },
  { label: "Med", value: SCORING.importanceLevels.med },
  { label: "High", value: SCORING.importanceLevels.high },
];

/** The candidate we preview live alignment against (the slice's reference profile). */
const PREVIEW_SLUG = "scott-wiener";

export default function QuizFlow() {
  const { values, ready, hasVector, setStance, setImportance, reset } =
    useUserValues();

  const candidate = getCandidate(PREVIEW_SLUG);

  // Live preview — recomputed on EVERY answer change. `values` gets a new identity on
  // each setStance/setImportance (the provider replaces the object), and the scoring
  // functions are pure, so this memo is the single source of the moving numbers (B2/G1).
  const preview = React.useMemo(() => {
    if (!candidate) return null;
    const { alignment, perIssue } = computeAlignment(values, candidate.stances);
    const confidence = computeConfidence(values, candidate.stances, alignment);
    const { strength } = measureLean(alignment);
    return { alignment, confidence, answered: perIssue.length, strength };
  }, [values, candidate]);

  if (!ready) {
    return <QuizSkeleton />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:items-start">
      {/* Issue cards */}
      <div className="flex flex-col gap-4">
        {ISSUES.map((issue) => {
          const stance = values.stances[issue.id] ?? 0;
          const importance = values.importance[issue.id];
          return (
            <Card key={issue.id}>
              <CardHeader className="gap-2 pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <IssueBadge issue={issue.id} size="sm" />
                  <CardTitle className="text-base">{issue.label}</CardTitle>
                </div>
                <CardDescription>{issue.question}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Stance axis */}
                <div className="space-y-3">
                  <Slider
                    aria-label={`Your stance on ${issue.label}`}
                    min={-1}
                    max={1}
                    step={0.1}
                    value={[stance]}
                    onValueChange={(v) => setStance(issue.id, v[0])}
                  />
                  <div className="flex justify-between gap-4 text-xs text-muted-foreground">
                    <span className="max-w-[45%] leading-snug">
                      {issue.poleNeg}
                    </span>
                    <span className="max-w-[45%] text-right leading-snug">
                      {issue.polePos}
                    </span>
                  </div>
                </div>

                {/* Importance control */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    How much do you care?
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {IMPORTANCE_OPTIONS.map((opt) => {
                      const selected = importance === opt.value;
                      return (
                        <Button
                          key={opt.label}
                          type="button"
                          size="sm"
                          variant={selected ? "default" : "outline"}
                          aria-pressed={selected}
                          onClick={() => setImportance(issue.id, opt.value)}
                          className="w-full"
                        >
                          {opt.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Efficient-elicitation "why we're asking" */}
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-brand-700">
                    Helps decide:
                  </span>{" "}
                  {issue.mapsTo.join(", ")}
                </p>
              </CardContent>
            </Card>
          );
        })}

        <div className="pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={reset}
            disabled={!hasVector}
          >
            <RotateCcw className="h-4 w-4" />
            Reset answers
          </Button>
        </div>
      </div>

      {/* Live preview panel */}
      <aside className="lg:sticky lg:top-6">
        <Card glass className="overflow-hidden">
          <CardHeader className="gap-1 pb-4">
            <div className="flex items-center gap-2 text-brand-700">
              <Sparkles className="h-4 w-4" aria-hidden />
              <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                Live preview
              </CardTitle>
            </div>
            <CardDescription>
              Recomputed from the public record as you answer.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {!candidate || !preview ? (
              <p className="text-sm text-muted-foreground">
                Preview unavailable.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-sm text-foreground">
                    Your alignment with{" "}
                    <span className="font-semibold">{candidate.name}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <ScoreChip
                      value={preview.alignment}
                      label="Alignment"
                    />
                    <ConfidenceBadge value={preview.confidence.value} />
                  </div>
                  {hasVector ? (
                    <p className="text-xs text-muted-foreground">
                      {preview.answered} of {ISSUES.length} issues weighted ·
                      confidence {preview.confidence.bucket}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Set an importance above to start scoring — neutral 50%
                      until then.
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 border-t border-border pt-4">
                  {hasVector && (
                    <Button asChild variant="gradient" className="w-full">
                      <Link href="/ballot">
                        See your ballot
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                  <Button asChild variant="link" className="w-full">
                    <Link href={`/candidate/${PREVIEW_SLUG}`}>
                      See his full profile
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

/** Light placeholder shown until localStorage hydrates (`ready === false`). */
function QuizSkeleton() {
  return (
    <div
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:items-start"
      aria-hidden
    >
      <div className="flex flex-col gap-4">
        {ISSUES.map((issue) => (
          <Card key={issue.id}>
            <CardHeader className="gap-2 pb-4">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
              <div className="grid grid-cols-4 gap-2">
                {IMPORTANCE_OPTIONS.map((opt) => (
                  <div
                    key={opt.label}
                    className="h-9 w-full animate-pulse rounded-md bg-muted"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <aside className="lg:sticky lg:top-6">
        <Card glass>
          <CardContent className="space-y-3 p-6">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-7 w-40 animate-pulse rounded-full bg-muted" />
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
