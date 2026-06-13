import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FileText, MessageSquareQuote, Network, Scale } from "lucide-react";

import { getMeasure, listMeasureSlugs } from "@/lib/measures";
import { ProfileShell, ProfileSection } from "@/components/shared/ProfileShell";
import { FundingGraph } from "@/components/shared/FundingGraph";
import { SourceLink } from "@/components/shared/SourceLink";
import { MeasureAlignment } from "@/components/measure/MeasureAlignment";
import { ProfileAsk } from "@/components/profile/ProfileAsk";
import { Badge } from "@/components/ui/badge";

// Slice 4 — measure profiles (DESIGN §11; RUBRIC E1/E2/E3). Fully static: the four SF
// measures are known at build time, so we pre-render each and reject unknown slugs.
export const dynamicParams = false;

export function generateStaticParams() {
  return listMeasureSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const m = getMeasure(slug);
  if (!m) return { title: "Measure — Procivic" };
  return {
    title: `Prop ${m.code} — ${m.shortTitle} — Procivic`,
    description: `Prop ${m.code}: what it does, who's funding it, and your alignment — every claim cited.`,
  };
}

/** Split a plain-summary into readable paragraphs (the ingest store packs it as one string). */
function toParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default async function MeasurePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const m = getMeasure(slug);
  if (!m) notFound();

  const paragraphs = toParagraphs(m.plainSummary);

  return (
    <ProfileShell
      title={`Prop ${m.code} — ${m.shortTitle}`}
      subtitle="San Francisco local measure"
      backHref="/ballot"
      badges={
        <>
          <Badge variant="accent">Measure</Badge>
          <Badge variant="muted">Tier {m.dataTier} · standardized record</Badge>
        </>
      }
    >
      {/* E1 — What it does: plain-language summary, every claim cited. */}
      <ProfileSection title="What it does" icon={FileText}>
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-elev-1">
          <div className="space-y-3 text-sm leading-relaxed text-foreground">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {m.sourceUrls.length > 0 && (
            <div className="border-t border-border pt-3">
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Sources
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                {m.sourceUrls.map((url) => (
                  <SourceLink key={url} href={url} />
                ))}
              </div>
            </div>
          )}

          {m.result && (
            <div className="border-t border-border pt-3">
              <p className="text-sm text-foreground">
                <span className="font-semibold">Result:</span> {m.result.outcome} — YES{" "}
                {m.result.yesPct}% / NO {m.result.noPct}%{" "}
                <SourceLink href={m.result.sourceUrl} className="ml-1">
                  source
                </SourceLink>
              </p>
            </div>
          )}
        </div>
      </ProfileSection>

      {/* E2 — Who's funding it: support vs. oppose committees, traceable to DataSF. */}
      <ProfileSection title="Who's funding it" icon={Network}>
        <div className="space-y-2">
          <FundingGraph
            variant="measure"
            support={m.funding.support}
            oppose={m.funding.oppose}
            sourceUrl={m.funding.sourceUrl}
          />
          {m.funding.notes && (
            <p className="px-1 text-xs leading-relaxed text-muted-foreground">
              {m.funding.notes}
            </p>
          )}
        </div>
      </ProfileSection>

      {/* E3 — Your alignment: the user's values vs. this measure's YES position. */}
      <ProfileSection title="Your alignment" icon={Scale}>
        <MeasureAlignment slug={m.slug} />
      </ProfileSection>

      {/* Ask — grounded, cited Q&A scoped to this measure's evidence (D4/H2). */}
      <ProfileSection title="Ask about this measure" icon={MessageSquareQuote}>
        <ProfileAsk
          entityType="measure"
          slug={m.slug}
          entityName={`Prop ${m.code}`}
          starters={[
            "What would a YES vote do?",
            "Who funds the YES side?",
            "Who's opposed?",
          ]}
        />
      </ProfileSection>
    </ProfileShell>
  );
}
