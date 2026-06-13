import type { Metadata } from "next";
import { ISSUES } from "@/config/issues";
import { Logo } from "@/components/brand/Logo";
import { GradientText } from "@/components/brand/GradientText";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { IssueBadge } from "@/components/shared/IssueBadge";
import { ScoreChip } from "@/components/shared/ScoreChip";
import { ScoreMeter } from "@/components/shared/ScoreMeter";
import { ConfidenceBadge } from "@/components/shared/ConfidenceBadge";
import { RecommendationPill } from "@/components/shared/RecommendationPill";
import { StanceBar } from "@/components/shared/StanceBar";
import { VoteRow } from "@/components/shared/VoteRow";
import { SourceLink } from "@/components/shared/SourceLink";
import { ContradictionCallout } from "@/components/shared/ContradictionCallout";
import { BallotItemCard } from "@/components/shared/BallotItemCard";
import { FundingGraph } from "@/components/shared/FundingGraph";
import { WhyBreakdown } from "@/components/shared/WhyBreakdown";
import { CitedAnswer } from "@/components/shared/CitedAnswer";
import { CitationChip } from "@/components/shared/CitationChip";
import { AskPanel } from "@/components/shared/AskPanel";
import { ProfileShell, ProfileSection } from "@/components/shared/ProfileShell";

export const metadata: Metadata = {
  title: "Brand & design system — Procivic",
  description: "Civic Daylight: tokens, gradients, and the shared component library.",
};

const STEPS = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"] as const;
const RAMPS: { name: string; classes: string[] }[] = [
  {
    name: "brand · blue · trust / primary",
    classes: ["bg-brand-50","bg-brand-100","bg-brand-200","bg-brand-300","bg-brand-400","bg-brand-500","bg-brand-600","bg-brand-700","bg-brand-800","bg-brand-900","bg-brand-950"],
  },
  {
    name: "accent · purple · “decoded” / synthesis",
    classes: ["bg-accent-50","bg-accent-100","bg-accent-200","bg-accent-300","bg-accent-400","bg-accent-500","bg-accent-600","bg-accent-700","bg-accent-800","bg-accent-900","bg-accent-950"],
  },
  {
    name: "signal · red · conflict / alert (never a party color)",
    classes: ["bg-signal-50","bg-signal-100","bg-signal-200","bg-signal-300","bg-signal-400","bg-signal-500","bg-signal-600","bg-signal-700","bg-signal-800","bg-signal-900","bg-signal-950"],
  },
  {
    name: "neutral · slate",
    classes: ["bg-slate-50","bg-slate-100","bg-slate-200","bg-slate-300","bg-slate-400","bg-slate-500","bg-slate-600","bg-slate-700","bg-slate-800","bg-slate-900","bg-slate-950"],
  },
];

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

const SAMPLE_DONORS = [
  { name: "ActBlue (conduit)", amount: 27735, employer: "Conduit" },
  { name: "Ceron Uribe, Juan", amount: 14000, employer: "OpenAI" },
  { name: "Cohen, Michael", amount: 10325, employer: "General Motors" },
  { name: "Seibel, Michael", amount: 10300, employer: "Y Combinator" },
  { name: "Larsen, Chris", amount: 10300, employer: "Ripple" },
  { name: "Goldman, John", amount: 10300, employer: "Self-employed" },
];

export default function BrandPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-12 px-4 py-10 sm:px-6">
      {/* Hero */}
      <header className="glass rounded-2xl bg-gradient-decoded-soft p-6 sm:p-10">
        <Logo variant="wordmark" className="h-9" />
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
          <GradientText>Civic Daylight</GradientText>
        </h1>
        <p className="mt-2 max-w-2xl text-lg text-muted-foreground">
          Procivic&apos;s design system — modern, trustworthy, a touch bold. Light-blue +
          purple + red, soft gradients, tasteful glass. Every component below is the one
          shared, tokenized library the product is built from.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="gradient" size="lg">Primary action</Button>
          <Button variant="outline" size="lg">Secondary</Button>
          <Button variant="ghost" size="lg">Ghost</Button>
        </div>
      </header>

      {/* Palette */}
      <Section title="Color schema" subtitle="Token ramps (see BRAND.md for hex). Color is semantic — red means conflict, never a party.">
        <div className="space-y-5">
          {RAMPS.map((ramp) => (
            <div key={ramp.name}>
              <p className="mb-1.5 text-sm font-medium">{ramp.name}</p>
              <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-11">
                {ramp.classes.map((c, i) => (
                  <div key={c} className="space-y-1">
                    <div className={`h-12 rounded-md border border-black/5 ${c}`} />
                    <p className="text-center text-[10px] text-muted-foreground">{STEPS[i]}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Gradients & glass */}
      <Section title="Gradients, glass & elevation">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <div className="grid h-24 place-items-center rounded-xl bg-gradient-decoded font-semibold text-white shadow-glow">gradient-decoded</div>
            <p className="text-xs text-muted-foreground">Hero, CTA, logo, the verdict.</p>
          </div>
          <div className="space-y-2">
            <div className="grid h-24 place-items-center rounded-xl bg-gradient-receipt font-semibold text-white">gradient-receipt</div>
            <p className="text-xs text-muted-foreground">The contradiction receipt.</p>
          </div>
          <div className="space-y-2">
            <div className="grid h-24 place-items-center rounded-xl bg-gradient-decoded-soft">
              <div className="glass rounded-lg px-4 py-2 text-sm font-medium">glass surface</div>
            </div>
            <p className="text-xs text-muted-foreground">Aurora backdrop + glassmorphism.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="grid h-16 w-28 place-items-center rounded-lg bg-card text-xs shadow-elev-1">elev-1</div>
          <div className="grid h-16 w-28 place-items-center rounded-lg bg-card text-xs shadow-elev-2">elev-2</div>
          <div className="grid h-16 w-28 place-items-center rounded-lg bg-card text-xs shadow-elev-3">elev-3</div>
        </div>
      </Section>

      {/* Typography */}
      <Section title="Typography" subtitle="Inter for UI, JetBrains Mono (tabular) for figures.">
        <div className="space-y-1.5">
          <p className="text-4xl font-bold tracking-tight">Display — your ballot, decoded</p>
          <p className="text-2xl font-semibold">Heading — every item, with the receipts</p>
          <p className="text-base text-foreground">Body — Procivic computes the alignment between your stated values and the public record, then shows the rationale.</p>
          <p className="text-sm text-muted-foreground">Small / muted — based on 47 votes covering 6 of your 8 priority issues.</p>
          <p className="tabular text-sm">Figures — $3,958,852 · 82% · 47 votes</p>
        </div>
      </Section>

      {/* Score language */}
      <Section title="Score language" subtitle="One diverging scale — low (signal) → mid (accent) → high (brand) — across Alignment / Confidence / Consistency / Transparency.">
        <div className="flex flex-wrap items-center gap-2">
          <ScoreChip value={88} label="aligned" />
          <ScoreChip value={55} label="aligned" />
          <ScoreChip value={22} label="aligned" />
          <ConfidenceBadge value={82} showValue />
          <ConfidenceBadge value={55} showValue />
          <ConfidenceBadge value={30} showValue />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <ScoreMeter
            label="Alignment"
            value={82}
            sublabel="How a vote for this item fits your values."
            inputs={[
              { label: "coverage", value: "6/8" },
              { label: "evidence", value: "votes" },
            ]}
          />
          <ScoreMeter
            label="Consistency"
            value={64}
            sublabel="Stated positions vs. actual votes."
            inputs={[{ label: "issues", value: 7 }, { label: "matches", value: 5 }]}
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Issue stance (neutral axis)</CardTitle>
          </CardHeader>
          <CardContent>
            <StanceBar
              value={0.7}
              compareValue={0.2}
              poleNeg="Slow / limit new development"
              polePos="Build much more housing"
            />
          </CardContent>
        </Card>
      </Section>

      {/* Issue badges */}
      <Section title="Issue badges" subtitle="One canonical icon per ballot-tailored issue axis.">
        <div className="flex flex-wrap gap-2">
          {ISSUES.map((i) => (
            <IssueBadge key={i.id} issue={i.id} />
          ))}
        </div>
      </Section>

      {/* Recommendation + badges */}
      <Section title="Recommendation pill & badges">
        <div className="flex flex-wrap items-center gap-3">
          <RecommendationPill recommendation="YES" alignment={82} confidence={78} />
          <RecommendationPill recommendation="Lean NO" alignment={38} confidence={52} />
          <RecommendationPill recommendation="Wiener" alignment={71} confidence={84} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>default</Badge>
          <Badge variant="accent">accent</Badge>
          <Badge variant="signal">signal</Badge>
          <Badge variant="solid">solid</Badge>
          <Badge variant="outline">outline</Badge>
          <Badge variant="muted">muted</Badge>
        </div>
      </Section>

      {/* Votes */}
      <Section title="Vote rows">
        <div className="space-y-2">
          <VoteRow
            vote={{ billId: "SB 9", title: "Allow duplexes & lot splits on single-family lots", position: "Yea", issue: "housing", direction: 1, date: "2021-09-16", sourceUrl: "https://openstates.org" }}
          />
          <VoteRow
            vote={{ billId: "SB 50", title: "Density near transit & jobs", position: "Yea", issue: "housing", direction: 1, sourceUrl: "https://openstates.org" }}
          />
        </div>
      </Section>

      {/* Ballot item cards */}
      <Section title="Ballot item cards" subtitle="The spine — candidate + measure variants, plus the honest 'data unavailable' state.">
        <div className="grid gap-3 sm:grid-cols-2">
          <BallotItemCard
            variant="candidate"
            title="Scott Wiener"
            subtitle="U.S. House CA-11 (Pelosi open seat)"
            href="/brand"
            tierLabel="Tier 1 · deep record"
            recommendation={{ label: "Wiener", alignment: 71, confidence: 84 }}
            why="Your housing & climate priorities line up with his Senate votes."
          />
          <BallotItemCard
            variant="measure"
            title="Prop A — Earthquake Safety Bond"
            subtitle="San Francisco local measure"
            href="/brand"
            recommendation={{ label: "YES", alignment: 76, confidence: 68 }}
            why="You favor investing in major public infrastructure."
          />
          <BallotItemCard
            variant="measure"
            title="Prop D — Business / “Overpaid CEO” Tax"
            subtitle="San Francisco local measure"
            href="/brand"
            recommendation={{ label: "Lean NO", alignment: 41, confidence: 55 }}
            why="Mixed: you lean lower-tax but care about inequality."
          />
          <BallotItemCard
            variant="candidate"
            title="Supervisor, District 4"
            subtitle="No standardized record available"
            href="/brand"
            tierLabel="Tier 3"
            dataUnavailable
            why="Funding shown; stated positions only — labeled honestly."
          />
        </div>
      </Section>

      {/* Receipt */}
      <Section title="The receipt (contradiction callout)">
        <ContradictionCallout
          issue="housing"
          statement={{ text: "We must protect neighborhood character from overdevelopment.", sourceUrl: "https://example.com/statement" }}
          votes={[{ title: "SB 9 (duplexes statewide)", position: "Yea", sourceUrl: "https://openstates.org" }]}
          donor={{ name: "A real-estate developer PAC", amount: 12000, sourceUrl: "https://www.fec.gov" }}
          note="Illustrative sample for the design system."
        />
      </Section>

      {/* Funding */}
      <Section title="Funding graph (shell + ranked-bar fallback)">
        <div className="grid gap-4 lg:grid-cols-2">
          <FundingGraph variant="candidate" total={3958852} donors={SAMPLE_DONORS} sourceUrl="https://www.fec.gov" />
          <FundingGraph
            variant="measure"
            support={[{ committee: "Yes on D – Stand Up for SF", amount: 2990487 }]}
            oppose={[{ committee: "Yes on C, No on D (business coalition)", amount: 6075009 }]}
            sourceUrl="https://data.sfgov.org"
          />
        </div>
      </Section>

      {/* Why + cited answer */}
      <Section title="Why breakdown & cited answer">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Why this recommendation</CardTitle></CardHeader>
            <CardContent>
              <WhyBreakdown
                summary="This recommendation is driven by the issues you weighted highest."
                factors={[
                  { issue: "housing", agree: 0.92, weight: 1, sourceUrl: "https://openstates.org" },
                  { issue: "climate", agree: 0.8, weight: 0.5, sourceUrl: "https://openstates.org" },
                  { issue: "business_tax", agree: 0.35, weight: 0.5 },
                ]}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Cited answer</CardTitle></CardHeader>
            <CardContent>
              <CitedAnswer
                text="He voted to expand housing supply, backing SB 9[1] and density near transit[2]. On climate, he supported aggressive targets[1]."
                citations={[
                  { label: "OpenStates — SB 9 roll-call", href: "https://openstates.org" },
                  { label: "OpenStates — SB 50 roll-call", href: "https://openstates.org" },
                ]}
              />
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-sm text-muted-foreground">
                <span>Standalone citation chips:</span>
                <CitationChip index={1} href="https://openstates.org" title="OpenStates roll-call" />
                <CitationChip index={2} href="https://www.fec.gov" title="OpenFEC record" />
                <CitationChip index={3} title="unlinked marker" />
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Ask panel */}
      <Section title="Ask Procivic">
        <AskPanel
          entityName="Scott Wiener"
          starters={["How did they vote on housing?", "Who are their biggest donors?", "Is this consistent with what they said?"]}
          answer={{
            text: "Wiener consistently voted to increase housing supply — e.g. SB 9[1]. His top disclosed donors are tech and venture figures[2].",
            citations: [
              { label: "OpenStates — SB 9", href: "https://openstates.org" },
              { label: "OpenFEC — itemized contributions", href: "https://www.fec.gov" },
            ],
          }}
        />
      </Section>

      {/* Quiz input + profile shell */}
      <Section title="Quiz input & profile shell">
        <Card>
          <CardHeader><CardTitle className="text-base">Stance slider (quiz)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Slider defaultValue={[0.4]} min={-1} max={1} step={0.1} aria-label="Stance" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Slow / limit development</span>
              <span>Build much more housing</span>
            </div>
          </CardContent>
        </Card>
        <Separator />
        <div className="overflow-hidden rounded-2xl border border-border">
          <ProfileShell
            title="Scott Wiener"
            subtitle="U.S. House CA-11 · CA State Senator"
            backHref="/brand"
            backLabel="Profile shell preview"
            badges={<>
              <Badge variant="solid">Tier 1</Badge>
              <IssueBadge issue="housing" size="sm" />
            </>}
            recommendation={<RecommendationPill recommendation="Wiener" alignment={71} confidence={84} />}
          >
            <ProfileSection title="Evidence section" description="Sections compose inside the shared shell.">
              <Card><CardContent className="p-4 text-sm text-muted-foreground">Stances, votes, funding, consistency, and Ask all live here.</CardContent></Card>
            </ProfileSection>
          </ProfileShell>
        </div>
      </Section>

      <footer className="border-t border-border pt-6 text-sm text-muted-foreground">
        Procivic · Civic Daylight design system · <SourceLink href="https://procivic.vercel.app">live</SourceLink>
      </footer>
    </main>
  );
}
