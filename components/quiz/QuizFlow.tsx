"use client";

// Procivic — the onboarding quiz (DESIGN.md §9; RUBRIC B1, B2, G1).
//
// For each of the 10 ISSUES we elicit two things: a STANCE on a neutral [-1,+1] axis
// (a 5-point segmented selector: -1/-0.5/0/+0.5/+1) and an IMPORTANCE weight
// (None/Low/Med/High -> SCORING.importanceLevels). Both write through the
// useUserValues() contract and are read back from `values`, so the controls are
// fully controlled reflections of the persisted vector.
//
// Once the user has answered anything (hasVector), a "See your ballot" CTA carries
// them onward to /ballot, where alignment is scored against the candidate records.

import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";

import { ISSUES } from "@/config/issues";
import { SCORING } from "@/config/scoring.config";
import { useUserValues } from "@/lib/userValues";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IssueBadge } from "@/components/shared/IssueBadge";

/** Importance buttons, in order, mapped to the config weights (no magic numbers). */
const IMPORTANCE_OPTIONS: { label: string; value: number }[] = [
  { label: "None", value: SCORING.importanceLevels.none },
  { label: "Low", value: SCORING.importanceLevels.low },
  { label: "Med", value: SCORING.importanceLevels.med },
  { label: "High", value: SCORING.importanceLevels.high },
];

/**
 * The 5-point stance scale, in axis order (poleNeg -> polePos). `value` is the stance
 * written via setStance(); `tone` is the short descriptor shown under each segment.
 */
const STANCE_OPTIONS: { value: number; tone: string }[] = [
  { value: -1, tone: "Strongly" },
  { value: -0.5, tone: "Lean" },
  { value: 0, tone: "Neutral" },
  { value: 0.5, tone: "Lean" },
  { value: 1, tone: "Strongly" },
];

/** Accessible description of a stance option, given the issue's pole labels. */
function stanceOptionLabel(
  value: number,
  poleNeg: string,
  polePos: string,
): string {
  switch (value) {
    case -1:
      return `Strongly: ${poleNeg}`;
    case -0.5:
      return `Lean toward: ${poleNeg}`;
    case 0:
      return "Neutral — no strong preference";
    case 0.5:
      return `Lean toward: ${polePos}`;
    case 1:
      return `Strongly: ${polePos}`;
    default:
      return "Stance";
  }
}

export default function QuizFlow() {
  const { values, ready, hasVector, setStance, setImportance, reset } =
    useUserValues();

  if (!ready) {
    return <QuizSkeleton />;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {/* Issue cards */}
      <div className="flex flex-col gap-4">
        {ISSUES.map((issue) => {
          // Unanswered = nothing selected. We DON'T default to 0 here, otherwise the
          // neutral segment would look chosen before the user touches the scale.
          const stance = values.stances[issue.id];
          const importance = values.importance[issue.id];
          return (
            <Card key={issue.id}>
              <CardHeader className="gap-1.5 pb-4">
                {/* One clear heading: the question is the title. The issue icon is a
                    small visual cue (no label text — the question already names it). */}
                <div className="flex items-start gap-2">
                  <IssueBadge
                    issue={issue.id}
                    size="sm"
                    showLabel={false}
                    className="mt-0.5 shrink-0"
                  />
                  <CardTitle className="text-base leading-snug">
                    {issue.question}
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Stance — a controlled 5-point scale between the two pole anchors. */}
                <div
                  className="space-y-2"
                  role="radiogroup"
                  aria-label={`Your stance on ${issue.label}`}
                >
                  <div className="grid grid-cols-5 gap-1.5">
                    {STANCE_OPTIONS.map((opt) => {
                      const selected = stance === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          aria-pressed={selected}
                          aria-label={stanceOptionLabel(
                            opt.value,
                            issue.poleNeg,
                            issue.polePos,
                          )}
                          onClick={() => setStance(issue.id, opt.value)}
                          className={`flex flex-col items-center gap-1.5 rounded-lg border px-1 py-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                            selected
                              ? "border-brand-500 bg-brand-50 text-brand-800"
                              : "border-border bg-white/60 text-muted-foreground hover:bg-brand-50/60 hover:text-brand-700"
                          }`}
                        >
                          <span
                            className={`h-3 w-3 rounded-full border-2 transition-colors ${
                              selected
                                ? "border-brand-500 bg-brand-500"
                                : "border-border bg-transparent"
                            }`}
                            aria-hidden
                          />
                          <span className="text-[0.65rem] font-medium leading-tight">
                            {opt.tone}
                          </span>
                        </button>
                      );
                    })}
                  </div>
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

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
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

          {/* Onward CTA — shown once the user has answered anything. */}
          {hasVector && (
            <Button asChild variant="gradient" size="lg">
              <Link href="/ballot">
                See your ballot
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Light placeholder shown until localStorage hydrates (`ready === false`). */
function QuizSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4" aria-hidden>
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
  );
}
