import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";

import { getRace, listRaceIds, type RaceCandidate } from "@/lib/races";
import { ProfileShell, ProfileSection } from "@/components/shared/ProfileShell";
import { RaceCandidateAlignment } from "@/components/race/RaceCandidateAlignment";
import { SourceLink } from "@/components/shared/SourceLink";
import { Badge } from "@/components/ui/badge";
import { formatUSD, clamp } from "@/lib/utils";

// SSG: the race field is known at build time, so we pre-render each race and reject unknowns.
export const dynamicParams = false;

export function generateStaticParams() {
  return listRaceIds().map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const r = getRace(id);
  if (!r) return { title: "Race — Procivic" };
  return {
    title: `${r.office} — Procivic`,
    description: `${r.office}: the full candidate field, FEC funding, and — where a standardized voting record exists — your alignment. Every claim cited.`,
  };
}

/**
 * Sort the field: advanced candidates first, then by FEC total descending (no committee on
 * file sorts last). Pure + deterministic — same input always yields the same order.
 */
function sortCandidates(candidates: RaceCandidate[]): RaceCandidate[] {
  return [...candidates].sort((a, b) => {
    if (a.advanced !== b.advanced) return a.advanced ? -1 : 1;
    const fa = a.funding?.total ?? -1;
    const fb = b.funding?.total ?? -1;
    return fb - fa;
  });
}

export default async function RacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const r = getRace(id);
  if (!r) notFound();

  const candidates = sortCandidates(r.candidates);
  // Bar widths are relative to the best-funded candidate in THIS race (0 when nobody has data).
  const maxFundingInRace = candidates.reduce(
    (max, c) => Math.max(max, c.funding?.total ?? 0),
    0,
  );

  return (
    <ProfileShell
      title={r.office}
      subtitle={r.subtitle}
      backHref="/ballot"
      badges={
        <>
          <Badge variant="solid">Federal</Badge>
          <Badge variant="outline">Top-two primary</Badge>
        </>
      }
    >
      <ProfileSection title="Candidates" icon={Users}>
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          Alignment is computed only where a standardized voting record exists. Everyone&rsquo;s
          funding is sourced from the FEC.
        </p>

        <ul className="space-y-3">
          {candidates.map((c) => {
            const barPct =
              c.funding && maxFundingInRace > 0
                ? clamp((c.funding.total / maxFundingInRace) * 100, 0, 100)
                : 0;

            return (
              <li
                key={c.slug}
                className="rounded-xl border border-border bg-card p-4 shadow-elev-1 sm:p-5"
              >
                {/* Identity */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-base font-semibold tracking-tight text-foreground">
                    {c.name}
                  </span>
                  <span className="text-sm text-muted-foreground">· {c.party}</span>
                  {c.advanced && (
                    <Badge variant="solid">Advanced to November</Badge>
                  )}
                </div>

                {/* Funding — FEC total + a bar relative to the race leader, every fact cited. */}
                <div className="mt-3">
                  {c.funding ? (
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <span className="text-sm font-medium text-foreground">
                          {formatUSD(c.funding.total, { compact: true })}
                          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                            raised
                          </span>
                        </span>
                        <SourceLink href={c.funding.sourceUrl}>FEC</SourceLink>
                      </div>
                      <div
                        className="h-2 w-full overflow-hidden rounded-full bg-muted"
                        role="img"
                        aria-label={`${c.name} raised ${formatUSD(c.funding.total, {
                          compact: true,
                        })}`}
                      >
                        <div
                          className="h-full rounded-full bg-gradient-decoded"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No FEC committee on file.
                    </p>
                  )}
                </div>

                {/* Alignment / record */}
                <div className="mt-3 border-t border-border pt-3">
                  {c.hasProfile ? (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <RaceCandidateAlignment slug={c.slug} />
                      <Link
                        href={`/candidate/${c.slug}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
                      >
                        View full profile
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Stated positions only · no standardized voting record yet.
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </ProfileSection>
    </ProfileShell>
  );
}
