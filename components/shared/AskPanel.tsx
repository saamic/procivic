"use client";

import * as React from "react";
import { MessageSquareQuote, SendHorizonal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CitedAnswer, type Citation } from "@/components/shared/CitedAnswer";
import { cn } from "@/lib/utils";

export interface AskAnswer {
  text: string;
  citations?: Citation[];
}

/**
 * "Ask Procivic" — a grounded, cited Q&A affordance scoped to one profile's evidence
 * (DESIGN §8.4). Starter questions are intelligently selected per profile (passed in),
 * never hardcoded here. Answers are cited and refuse rather than guess (enforced server-side).
 */
export function AskPanel({
  entityName,
  starters,
  onAsk,
  answer,
  loading = false,
  className,
}: {
  entityName?: string;
  starters: string[];
  onAsk?: (question: string) => void | Promise<void>;
  answer?: AskAnswer | null;
  loading?: boolean;
  className?: string;
}) {
  const [value, setValue] = React.useState("");

  function submit(q: string) {
    const question = q.trim();
    if (!question || loading) return;
    onAsk?.(question);
  }

  return (
    <div className={cn("glass rounded-xl p-4", className)}>
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-decoded text-white">
          <MessageSquareQuote className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold leading-tight">Ask Procivic</p>
          <p className="text-xs text-muted-foreground">
            {entityName
              ? `Grounded in ${entityName}'s record — cited, or it says it doesn't know.`
              : "Grounded, cited answers — or an honest “I don’t have a record on that.”"}
          </p>
        </div>
      </div>

      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
      >
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask about votes, funding, consistency…"
          aria-label="Ask a question"
        />
        <Button type="submit" size="icon" disabled={loading || !value.trim()}>
          <SendHorizonal className="h-4 w-4" />
          <span className="sr-only">Ask</span>
        </Button>
      </form>

      {starters.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {starters.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setValue(s);
                submit(s);
              }}
              className="inline-flex items-center gap-1 rounded-full border border-accent-200 bg-accent-50 px-2.5 py-1 text-xs font-medium text-accent-700 transition-colors hover:bg-accent-100"
            >
              <Sparkles className="h-3 w-3" aria-hidden />
              {s}
            </button>
          ))}
        </div>
      )}

      {(loading || answer) && (
        <div className="mt-4 border-t border-border pt-3">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : answer ? (
            <CitedAnswer text={answer.text} citations={answer.citations} />
          ) : null}
        </div>
      )}
    </div>
  );
}
