import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Scale,
  Gauge,
  FileCheck2,
  GitCompareArrows,
  Eye,
  SlidersHorizontal,
  ListChecks,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileSection } from "@/components/shared/ProfileShell";
import { IssueBadge } from "@/components/shared/IssueBadge";
import { GradientText } from "@/components/brand/GradientText";
import { SCORING, ISSUE_BASE_WEIGHT } from "@/config/scoring.config";
import { ISSUES } from "@/config/issues";

export const metadata: Metadata = {
  title: "How Procivic works — Methodology",
  description:
    "Every weight, threshold, and formula Procivic uses, read straight from the live scoring config. Nothing hidden, nothing editorial.",
};

/** Inline mono span for numbers/symbols so figures always line up. */
function Mono({ children }: { children: React.ReactNode }) {
  return <span className="tabular">{children}</span>;
}

/** Small formula block — calm, legible, evidence-first. */
function Formula({ children }: { children: React.ReactNode }) {
  return (
    <div className="tabular overflow-x-auto rounded-lg border border-border bg-muted/60 px-4 py-3 text-sm leading-relaxed text-foreground">
      {children}
    </div>
  );
}

/** Two-column key/value table used for every weight set. */
function WeightTable({
  rows,
  keyHeader = "Component",
  valueHeader = "Weight",
}: {
  rows: Array<{ key: React.ReactNode; value: React.ReactNode; note?: React.ReactNode }>;
  keyHeader?: string;
  valueHeader?: string;
}) {
  const hasNote = rows.some((r) => r.note);
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-2 font-semibold">{keyHeader}</th>
            <th className="px-4 py-2 text-right font-semibold">{valueHeader}</th>
            {hasNote && <th className="px-4 py-2 font-semibold">What it means</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className="border-b border-border/60 last:border-b-0 even:bg-muted/30"
            >
              <td className="px-4 py-2 font-medium text-foreground">{r.key}</td>
              <td className="px-4 py-2 text-right">
                <Mono>{r.value}</Mono>
              </td>
              {hasNote && (
                <td className="px-4 py-2 text-muted-foreground">{r.note}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MethodologyPage() {
  const { alignment, confidence, evidenceWeight, consistency, transparency, importanceLevels } =
    SCORING;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      {/* Intro — the non-editorializing principle, stated plainly. */}
      <header className="glass rounded-2xl bg-gradient-decoded-soft p-5 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          How Procivic <GradientText>works</GradientText>
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Procivic doesn&apos;t have an opinion. It computes the alignment between{" "}
          <span className="font-medium text-foreground">your</span> stated values and
          the public record — votes, money, and on-the-record positions — and shows you
          the math. It never says a candidate or measure is good or bad; it only says how
          closely it matches what <span className="font-medium text-foreground">you</span>{" "}
          told us, with a receipt one click away. The verdict is yours, and you can
          override it anytime.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Every weight, threshold, and formula below is read live from{" "}
          <Mono>config/scoring.config.ts</Mono> — the same file the scoring engine reads.
          There is no separate, hidden set of numbers; this page cannot drift from the
          engine.
        </p>
      </header>

      <div className="mt-8 space-y-8">
        {/* 1. ALIGNMENT */}
        <ProfileSection
          title="Alignment"
          icon={Scale}
          description="How close an item sits to your stated values, on a 0–100 scale."
        >
          <Card>
            <CardContent className="space-y-4 p-5 sm:p-6">
              <p className="text-sm leading-relaxed text-muted-foreground">
                For each issue, agreement is the distance between your position{" "}
                <Mono>u_i</Mono> and the item&apos;s stance <Mono>stance_i</Mono> (both on
                a <Mono>−1…+1</Mono> axis). Identical positions score{" "}
                <Mono>1</Mono>, opposite positions score <Mono>0</Mono>. Alignment is the
                weighted average across the issues the item has a stance on, where each
                weight <Mono>w_i</Mono> is{" "}
                <span className="font-medium text-foreground">
                  your own importance weight
                </span>{" "}
                for that issue — nothing else.
              </p>
              <Formula>
                <div>agree_i = 1 − |u_i − stance_i| / 2</div>
                <div className="mt-1">
                  alignment = 100 × Σ(w_i · agree_i) / Σ(w_i)
                </div>
              </Formula>
              <p className="text-sm leading-relaxed text-muted-foreground">
                For ballot measures, we compute the alignment of the{" "}
                <span className="font-medium text-foreground">YES</span> position. If it
                is <Mono>≥ {alignment.leanThreshold}</Mono> the lean is{" "}
                <span className="font-medium text-foreground">YES</span>, otherwise NO;
                the strength is how far it sits from <Mono>{alignment.leanThreshold}</Mono>.
              </p>
            </CardContent>
          </Card>
        </ProfileSection>

        {/* 2. CONFIDENCE */}
        <ProfileSection
          title="Confidence"
          icon={Gauge}
          description="An honest read of how much we actually know — not how strong the lean is."
        >
          <Card>
            <CardContent className="space-y-4 p-5 sm:p-6">
              <Formula>
                confidence = 100 × ( {confidence.cCoverage}·coverage +{" "}
                {confidence.cEvidence}·evidenceStrength + {confidence.cDecisive}·decisiveness )
              </Formula>
              <WeightTable
                keyHeader="Coefficient"
                valueHeader="Value"
                rows={[
                  {
                    key: "coverage",
                    value: confidence.cCoverage,
                    note: "Share of the issues you care about that the item actually has evidence on.",
                  },
                  {
                    key: "evidenceStrength",
                    value: confidence.cEvidence,
                    note: "Average quality of the evidence used (see Evidence weight below).",
                  },
                  {
                    key: "decisiveness",
                    value: confidence.cDecisive,
                    note: "How far from a coin-flip the alignment is: |alignment − 50| / 50.",
                  },
                ]}
              />
              <WeightTable
                keyHeader="Confidence band"
                valueHeader="Range"
                rows={[
                  { key: "High", value: `≥ ${confidence.highMin}` },
                  {
                    key: "Med",
                    value: `${confidence.medMin}–${confidence.highMin - 1}`,
                  },
                  { key: "Low", value: `< ${confidence.medMin}` },
                ]}
              />
            </CardContent>
          </Card>
        </ProfileSection>

        {/* 3. EVIDENCE WEIGHT */}
        <ProfileSection
          title="Evidence weight"
          icon={FileCheck2}
          description="How much we trust each kind of evidence. Actions count more than words."
        >
          <Card>
            <CardContent className="p-5 sm:p-6">
              <WeightTable
                keyHeader="Basis"
                valueHeader="Weight"
                rows={[
                  {
                    key: "Votes",
                    value: evidenceWeight.votes.toFixed(1),
                    note: "Recorded roll-call votes — the strongest signal.",
                  },
                  {
                    key: "Funding",
                    value: evidenceWeight.funding.toFixed(1),
                    note: "Who funds the campaign, from disclosure filings.",
                  },
                  {
                    key: "Stated",
                    value: evidenceWeight.stated.toFixed(1),
                    note: "On-the-record positions and statements.",
                  },
                ]}
              />
            </CardContent>
          </Card>
        </ProfileSection>

        {/* 4. CONSISTENCY */}
        <ProfileSection
          title="Consistency"
          icon={GitCompareArrows}
          description="Do stated positions match the voting record? (Tier-1 candidates.)"
        >
          <Card>
            <CardContent className="space-y-4 p-5 sm:p-6">
              <p className="text-sm leading-relaxed text-muted-foreground">
                For issues with both a stated position <Mono>s_i</Mono> and a vote-derived
                position <Mono>c_i</Mono>, we check whether they agree in sign. They count
                as consistent as long as they fall within a tolerance band of{" "}
                <Mono>|s_i − c_i| ≤ {consistency.tolerance}</Mono>. Consistency is the
                fraction of issues that agree.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                The <span className="font-medium text-foreground">receipt</span> is the
                single issue with the largest opposite-sign gap — said one thing, voted
                another — shown with the underlying roll-call, never as a judgment.
              </p>
            </CardContent>
          </Card>
        </ProfileSection>

        {/* 5. TRANSPARENCY */}
        <ProfileSection
          title="Transparency"
          icon={Eye}
          description="A composite of public-conduct signals, each shown on its own."
        >
          <Card>
            <CardContent className="p-5 sm:p-6">
              <WeightTable
                keyHeader="Component"
                valueHeader="Weight"
                rows={[
                  {
                    key: "Attendance",
                    value: transparency.weights.attendance,
                    note: "Share of votes and sessions attended.",
                  },
                  {
                    key: "Filing timeliness",
                    value: transparency.weights.filingTimeliness,
                    note: "Whether required filings were submitted on time.",
                  },
                  {
                    key: "Disclosure",
                    value: transparency.weights.disclosure,
                    note: "Completeness of financial and conflict disclosures.",
                  },
                ]}
              />
            </CardContent>
          </Card>
        </ProfileSection>

        {/* 6. IMPORTANCE LEVELS */}
        <ProfileSection
          title="Importance levels"
          icon={SlidersHorizontal}
          description="The quiz control that sets each issue's weight w_i in your alignment."
        >
          <Card>
            <CardContent className="p-5 sm:p-6">
              <WeightTable
                keyHeader="You said"
                valueHeader="Weight (w_i)"
                rows={[
                  { key: "Not important", value: importanceLevels.none },
                  { key: "A little", value: importanceLevels.low },
                  { key: "Somewhat", value: importanceLevels.med },
                  { key: "Very important", value: importanceLevels.high },
                ]}
              />
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                This is the only lever that moves your scores. An issue you mark{" "}
                <span className="font-medium text-foreground">Not important</span> drops
                out of the math entirely (<Mono>w_i = {importanceLevels.none}</Mono>).
              </p>
            </CardContent>
          </Card>
        </ProfileSection>

        {/* 7. PER-ISSUE BASE WEIGHTS */}
        <ProfileSection
          title="Per-issue base weights"
          icon={ListChecks}
          description="Every issue starts equal. We never secretly up- or down-weight a topic."
        >
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-base">All issues default to 1</CardTitle>
              <CardDescription>
                The base weight is uniform across every issue — the real weighting comes
                only from your importance choices above.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-2 font-semibold">Issue</th>
                      <th className="px-4 py-2 text-right font-semibold">Base weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ISSUES.map((issue) => (
                      <tr
                        key={issue.id}
                        className="border-b border-border/60 last:border-b-0 even:bg-muted/30"
                      >
                        <td className="px-4 py-2">
                          <IssueBadge issue={issue.id} size="sm" />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Mono>{ISSUE_BASE_WEIGHT[issue.id]}</Mono>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </ProfileSection>
      </div>

      <footer className="mt-10 border-t border-border pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </footer>
    </main>
  );
}
