"use client";

// Procivic — the per-profile "Ask Procivic" surface (DESIGN §8.4; RUBRIC D4/H2).
//
// A thin client wrapper that wires the presentational <AskPanel/> to the grounded
// /api/ask endpoint (lib/aiClient.askProcivic). It owns only the answer + loading
// state and passes the user's stored value vector through so the explainer can
// personalize; AskPanel itself renders the cited answer with [n] markers.

import * as React from "react";

import { AskPanel, type AskAnswer } from "@/components/shared/AskPanel";
import { askProcivic } from "@/lib/aiClient";
import { useUserValues } from "@/lib/userValues";

export function ProfileAsk({
  entityType,
  slug,
  entityName,
  starters,
}: {
  entityType: "candidate" | "measure";
  slug: string;
  entityName: string;
  starters: string[];
}) {
  const { values } = useUserValues();
  const [answer, setAnswer] = React.useState<AskAnswer | null>(null);
  const [loading, setLoading] = React.useState(false);

  const onAsk = React.useCallback(
    async (question: string) => {
      setLoading(true);
      try {
        const result = await askProcivic({
          entityType,
          slug,
          question,
          userValues: values,
        });
        setAnswer({ text: result.answer, citations: result.citations });
      } finally {
        setLoading(false);
      }
    },
    [entityType, slug, values],
  );

  return (
    <AskPanel
      entityName={entityName}
      starters={starters}
      onAsk={onAsk}
      answer={answer}
      loading={loading}
    />
  );
}
