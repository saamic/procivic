// Procivic — onboarding quiz route (DESIGN.md §9). Thin server component: it sets the
// page metadata + intro heading and hands off to the client QuizFlow, which owns all the
// interactive state and the live re-scoring preview.

import type { Metadata } from "next";
import QuizFlow from "@/components/quiz/QuizFlow";

export const metadata: Metadata = {
  title: "Your values — Procivic",
};

export default function QuizPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-6 sm:py-14">
      <header className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          What do you care about?
        </h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          ~60 seconds · adjust anytime · everything re-scores live
        </p>
      </header>

      <QuizFlow />
    </main>
  );
}
