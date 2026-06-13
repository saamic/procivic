// Procivic — candidate consistency & transparency (DESIGN §8.1; RUBRIC D3/G3).
//
// A server component that turns the candidate's NEW ingest fields (statedStances,
// transparency, consistencyNote) into two traceable, non-editorializing readouts:
//   • Consistency — stated positions vs. actual votes, every claim sourced (G3 traceability).
//   • Transparency — a weighted composite whose components are shown INDIVIDUALLY (G3).
// All math comes from the deterministic engine (lib/scoring.ts) reading config weights;
// nothing here fabricates a contradiction — when stated matches voted we say so honestly.

import { CheckCircle2, ShieldCheck } from "lucide-react";

import { getCandidate } from "@/lib/candidates";
import {
  computeConsistency,
  computeTransparency,
} from "@/lib/scoring";
import type { Stance, Statement } from "@/lib/types";
import type { IssueId } from "@/config/issues";
import { ProfileSection } from "@/components/shared/ProfileShell";
import { ScoreMeter } from "@/components/shared/ScoreMeter";
import { IssueBadge } from "@/components/shared/IssueBadge";
import { SourceLink } from "@/components/shared/SourceLink";
import { ContradictionCallout } from "@/components/shared/ContradictionCallout";

/** The extra ingest fields not yet on the shared Candidate type (read via a local cast). */
interface AccountabilityExtras {
  statedStances?: Stance[];
  consistencyNote?: string;
  transparency?: {
    attendance: number;
    filingTimeliness: number;
    disclosure: number;
    components?: { label: string; value: number; basis: string; count?: unknown }[];
    sourceUrls?: string[];
  };
}

export function CandidateAccountability({ slug }: { slug: string }) {
  const c = getCandidate(slug);
  if (!c) return null;

  const extra = c as unknown as AccountabilityExtras;
  const statedStances = extra.statedStances;
  const transparency = extra.transparency;

  // Without the Tier-1 accountability fields there is nothing honest to show.
  if (!statedStances?.length || !transparency) return null;

  // CONSISTENCY — stated positions vs. vote-derived stances (deterministic engine).
  const consistency = computeConsistency(statedStances, c.stances);

  // Index the supporting evidence so each comparison row can cite both sides.
  const statementByIssue = new Map<IssueId, Statement>();
  for (const s of c.statements ?? []) statementByIssue.set(s.issue, s);
  const voteByIssue = new Map<IssueId, (typeof c.votes)[number]>();
  for (const v of c.votes) if (!voteByIssue.has(v.issue)) voteByIssue.set(v.issue, v);

  const comparedIssues = statedStances.filter((s) => voteByIssue.has(s.issue));

  // TRANSPARENCY — weighted composite; each component surfaced individually (G3).
  const transparencyScore = computeTransparency({
    attendance: transparency.attendance,
    filingTimeliness: transparency.filingTimeliness,
    disclosure: transparency.disclosure,
  });

  return (
    <ProfileSection
      title="Consistency & transparency"
      icon={ShieldCheck}
      description="Do their stated positions match their votes — and how openly do they operate? A calculation, traced to the record."
    >
      <div className="space-y-6">
        {/* Consistency */}
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-elev-1">
          <ScoreMeter
            label="Consistency"
            value={consistency.value}
            sublabel="Stated positions vs. actual votes"
            inputs={consistency.inputs}
          />

          {/* G3 traceability: stated (cited) vs. voted (cited), per shared issue. */}
          <ul className="space-y-2.5 border-t border-border pt-3">
            {comparedIssues.map((stated) => {
              const stmt = statementByIssue.get(stated.issue);
              const vote = voteByIssue.get(stated.issue);
              return (
                <li
                  key={stated.issue}
                  className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3"
                >
                  <IssueBadge issue={stated.issue} size="sm" className="shrink-0" />
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      <span className="font-semibold text-foreground">Stated</span>{" "}
                      {stmt ? (
                        <SourceLink href={stmt.sourceUrl}>stated position</SourceLink>
                      ) : (
                        <span>no citable statement</span>
                      )}
                    </span>
                    <span aria-hidden>·</span>
                    <span>
                      <span className="font-semibold text-foreground">Voted</span>{" "}
                      {vote ? (
                        <SourceLink href={vote.sourceUrl}>{vote.billId}</SourceLink>
                      ) : (
                        <span>no roll-call</span>
                      )}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Receipt ONLY if the engine found an opposite-sign contradiction; else an honest note. */}
          {consistency.receipt
            ? (() => {
                const issue = consistency.receipt!.issue as IssueId;
                const stmt = statementByIssue.get(issue);
                const vote = voteByIssue.get(issue);
                if (!stmt || !vote) return null;
                return (
                  <ContradictionCallout
                    issue={issue}
                    statement={{ text: stmt.text, sourceUrl: stmt.sourceUrl }}
                    votes={[
                      {
                        title: vote.title,
                        position: vote.position,
                        sourceUrl: vote.sourceUrl,
                      },
                    ]}
                  />
                );
              })()
            : (
                <p className="flex items-start gap-2 rounded-lg border border-brand-200 bg-brand-50/60 p-3 text-sm text-foreground">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-brand-600"
                    aria-hidden
                  />
                  <span>
                    {extra.consistencyNote ??
                      `Consistent — stated positions match votes on all ${comparedIssues.length} compared ${
                        comparedIssues.length === 1 ? "issue" : "issues"
                      }.`}
                  </span>
                </p>
              )}
        </div>

        {/* Transparency */}
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-elev-1">
          <ScoreMeter
            label="Transparency"
            value={transparencyScore.value}
            sublabel="Key-vote attendance, on-time filing, and donor disclosure"
            inputs={transparencyScore.inputs?.map((inp) => ({
              label: inp.label,
              value: typeof inp.value === "number" ? `${Math.round(inp.value)}%` : inp.value,
            }))}
          />

          {transparency.sourceUrls && transparency.sourceUrls.length > 0 && (
            <div className="border-t border-border pt-3">
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Sources
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                {transparency.sourceUrls.map((url) => (
                  <SourceLink key={url} href={url} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProfileSection>
  );
}
