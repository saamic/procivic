import Link from "next/link";
import { ArrowRight, ShieldCheck, Scale, Network } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { GradientText } from "@/components/brand/GradientText";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <Logo variant="wordmark" className="h-9" />

      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Your ballot, <GradientText>decoded</GradientText>.
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
          See how your <em>actual</em> ballot fits your values — backed by votes and
          money, not talking points. Every recommendation comes with a confidence score
          and a cited, reviewable breakdown.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="gradient" size="lg">
          <Link href="/brand">
            Explore the design system <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-4 grid w-full gap-4 sm:grid-cols-3">
        {[
          { icon: Scale, title: "Personalized", body: "Your values vs. the public record — never our opinion." },
          { icon: ShieldCheck, title: "Cited & verified", body: "Every claim traces to a source; data is precomputed + verified." },
          { icon: Network, title: "Follow the money", body: "An interactive funding graph for every Tier-1 candidate." },
        ].map((f) => (
          <div key={f.title} className="glass rounded-xl p-5 text-left">
            <f.icon className="h-6 w-6 text-brand-500" />
            <h2 className="mt-3 font-semibold">{f.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
