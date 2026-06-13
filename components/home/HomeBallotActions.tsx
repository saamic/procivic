"use client";

import Link from "next/link";
import { ArrowRight, Eye, CheckCircle2 } from "lucide-react";
import { useUserValues } from "@/lib/userValues";
import { Button } from "@/components/ui/button";

/**
 * View + Align actions for a decoded election. "Align" is alignment-aware: if the user has
 * already taken the quiz, it becomes "Re-tune values" and View is promoted to the primary
 * action; otherwise "Align me" is primary. (DESIGN §4.2 — values in -> ballot decoded.)
 */
export function HomeBallotActions({ ballotHref }: { ballotHref: string }) {
  const { hasVector, ready } = useUserValues();
  const aligned = ready && hasVector;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild variant={aligned ? "gradient" : "outline"} size="sm">
        <Link href={ballotHref}>
          <Eye className="h-4 w-4" /> View ballot
        </Link>
      </Button>
      <Button asChild variant={aligned ? "outline" : "gradient"} size="sm">
        <Link href="/quiz">
          {aligned ? "Re-tune values" : "Align me"} <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
      <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
        <CheckCircle2 className="h-3.5 w-3.5" /> Decoded
      </span>
    </div>
  );
}
