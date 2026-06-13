import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MessageSquareQuote, Network } from "lucide-react";
import { getCandidate, listCandidateSlugs } from "@/lib/candidates";
import { ProfileShell, ProfileSection } from "@/components/shared/ProfileShell";
import { CandidateEvidence } from "@/components/profile/CandidateEvidence";
import { CandidateAccountability } from "@/components/profile/CandidateAccountability";
import { ProfileAsk } from "@/components/profile/ProfileAsk";
import { FundingGraphInteractive } from "@/components/profile/FundingGraphInteractive";
import { FundingGraph } from "@/components/shared/FundingGraph";
import { RoleBadge } from "@/components/profile/RoleBadge";
import { Badge } from "@/components/ui/badge";

export const dynamicParams = false;

export function generateStaticParams() {
  return listCandidateSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = getCandidate(slug);
  if (!c) return { title: "Candidate — Procivic" };
  return {
    title: `${c.name} — Procivic`,
    description: `${c.name}: vote-derived issue stances, voting record, and an interactive funding graph — every claim cited.`,
  };
}

export default async function CandidatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = getCandidate(slug);
  if (!c) notFound();

  const party = c.identity?.party ?? c.party;
  const office = c.identity?.office ?? c.office;
  const currentRole = (c.identity as { currentRole?: string } | undefined)?.currentRole;
  const tier = c.tier ?? (c as { dataTier?: number }).dataTier;

  return (
    <ProfileShell
      title={c.name}
      subtitle={office}
      backHref="/"
      backLabel="Home"
      badges={
        <>
          {tier === 1 ? (
            <Badge variant="solid">Tier 1 · deep record</Badge>
          ) : null}
          {party ? <Badge variant="outline">{party}</Badge> : null}
          {currentRole ? (
            <RoleBadge
              role={currentRole}
              explanation="A member of California's State Senate — the upper house of the state legislature (40 senators statewide). District 11 covers eastern San Francisco. State senators write, amend, and vote on California law; those floor votes are the public record Procivic uses to derive his issue stances."
            />
          ) : null}
        </>
      }
    >
      <CandidateEvidence
        stances={c.stances}
        votes={c.votes}
        statements={c.statements}
        statedStances={(c as any).statedStances}
      />

      <ProfileSection title="Follow the money" icon={Network}>
        <div className="space-y-4">
          <FundingGraphInteractive
            candidateName={c.name}
            donors={c.funding.topDonors}
            total={c.funding.total}
            sourceUrl={c.funding.sourceUrl}
          />
          <FundingGraph
            variant="candidate"
            total={c.funding.total}
            donors={c.funding.topDonors}
            sourceUrl={c.funding.sourceUrl}
          />
        </div>
      </ProfileSection>

      <CandidateAccountability slug={slug} />

      <ProfileSection title="Ask about their record" icon={MessageSquareQuote}>
        <ProfileAsk
          entityType="candidate"
          slug={c.slug}
          entityName={c.name}
          starters={[
            "How did they vote on housing?",
            "Who are their biggest donors?",
            "Are their votes consistent with what they've said?",
          ]}
        />
      </ProfileSection>
    </ProfileShell>
  );
}
