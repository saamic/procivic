import Link from "next/link";
import { Landmark, Building2, MapPin, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { GradientText } from "@/components/brand/GradientText";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { HomeBallotActions } from "@/components/home/HomeBallotActions";
import {
  UPCOMING_ELECTIONS,
  PAST_ELECTIONS,
  type ElectionEntry,
  type ElectionLevel,
} from "@/config/elections";

const LEVEL_ICON: Record<ElectionLevel, typeof Landmark> = {
  Federal: Landmark,
  State: Building2,
  Local: MapPin,
};

function ElectionRow({ e }: { e: ElectionEntry }) {
  const decoded = e.status === "decoded";
  return (
    <div
      className={cn(
        "rounded-xl border p-5",
        decoded ? "glass ring-1 ring-brand-200" : "border-border bg-card/60"
      )}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span className="tabular font-medium text-foreground">{e.dateLabel}</span>
        {decoded && (
          <Badge variant="solid" className="ml-auto gap-1">
            <CheckCircle2 className="h-3 w-3" /> Decoded
          </Badge>
        )}
      </div>

      <h3 className="mt-1.5 text-lg font-semibold tracking-tight">{e.name}</h3>
      <ul className="mt-2 space-y-1">
        {e.items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {e.levels.map((l) => {
          const Icon = LEVEL_ICON[l];
          return (
            <Badge key={l} variant="muted" className="gap-1">
              <Icon className="h-3 w-3" /> {l}
            </Badge>
          );
        })}
      </div>

      <div className="mt-4">
        {decoded ? (
          <HomeBallotActions ballotHref={e.href!} />
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              View ballot
            </Button>
            <Button variant="outline" size="sm" disabled>
              Align me
            </Button>
            <span className="text-xs text-muted-foreground">
              {e.status === "upcoming" ? "Coming soon" : "Not yet decoded"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <header className="text-center">
        <Logo variant="wordmark" className="mx-auto h-9 w-auto" />
        <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
          Your ballot, <GradientText>decoded</GradientText>.
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          Pick an election in San Francisco &amp; California — view the ballot, or align it to
          your values. Backed by votes and money, every claim cited.
        </p>
      </header>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Upcoming
        </h2>
        <div className="space-y-3">
          {UPCOMING_ELECTIONS.map((e) => (
            <ElectionRow key={e.id} e={e} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Recent &amp; past
        </h2>
        <div className="space-y-3">
          {PAST_ELECTIONS.map((e) => (
            <ElectionRow key={e.id} e={e} />
          ))}
        </div>
      </section>

      <footer className="mt-10 text-center text-xs text-muted-foreground">
        <Link
          href="/methodology"
          className="underline-offset-2 hover:text-brand-700 hover:underline"
        >
          How Procivic works
        </Link>
      </footer>
    </main>
  );
}
