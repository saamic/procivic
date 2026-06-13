"use client";

// Procivic — Slice 4 / RUBRIC E3: "Your alignment" for a measure profile.
//
// Decodes the user's stored value vector against THIS measure's YES position. The verdict
// (RecommendationPill + why) and the per-issue StanceBars are pure calculations over the
// user's values vs. the measure's stated YES direction — never Procivic's opinion. Below the
// pill, each tagged issue shows the user's stance (compareValue) vs. the YES position (value)
// with that issue's descriptive poles, so the WHY is legible, not a black box.

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ISSUES } from "@/config/issues";
import { recommendMeasure, measureStances } from "@/lib/recommend";
import { useUserValues } from "@/lib/userValues";
import { IssueBadge } from "@/components/shared/IssueBadge";
import { RecommendationPill } from "@/components/shared/RecommendationPill";
import { StanceBar } from "@/components/shared/StanceBar";
import { Skeleton } from "@/components/ui/skeleton";

export function MeasureAlignment({ slug }: { slug: string }) {
  const { values, ready, hasVector } = useUserValues();

  // Pre-hydration: a light skeleton so SSR and first client render agree (no flash of CTA).
  if (!ready) {
    return (
      <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-elev-1">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  // No value vector yet: invite the quiz rather than fabricate a recommendation.
  if (!hasVector) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 shadow-elev-1">
        <p className="text-sm text-muted-foreground">
          Your alignment is a calculation against your own values — not our opinion.
          We don&rsquo;t have your values yet.
        </p>
        <Link
          href="/quiz"
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-decoded px-4 py-2 text-sm font-semibold text-white shadow-glow transition-opacity hover:opacity-90"
        >
          Take the 60-second quiz to see your alignment
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    );
  }

  const rec = recommendMeasure(slug, values);
  const stances = measureStances(slug);

  // hasVector is true, so recommendMeasure returns a verdict; guard for type-safety only.
  if (!rec) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 shadow-elev-1">
        <p className="text-sm text-muted-foreground">
          We couldn&rsquo;t score this measure against your values.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-xl border border-border bg-card p-4 shadow-elev-1 sm:p-5">
      <div className="space-y-2">
        <RecommendationPill
          recommendation={rec.label}
          alignment={rec.alignment}
          confidence={rec.confidence}
        />
        <p className="text-sm text-muted-foreground">{rec.why}</p>
      </div>

      {stances.length > 0 && (
        <div className="space-y-4 border-t border-border pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Your values vs. a YES vote
          </p>
          <ul className="space-y-5">
            {stances.map((stance) => {
              const issueDef = ISSUES.find((i) => i.id === stance.issue);
              const userStance = values.stances[stance.issue];
              return (
                <li key={stance.issue} className="space-y-2">
                  <IssueBadge issue={stance.issue} size="sm" />
                  <StanceBar
                    value={stance.value}
                    compareValue={userStance}
                    poleNeg={issueDef?.poleNeg ?? ""}
                    polePos={issueDef?.polePos ?? ""}
                    entityLabel="YES vote"
                    compareLabel="You"
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
