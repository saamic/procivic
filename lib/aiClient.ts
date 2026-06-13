// Procivic — tiny client-side fetch helpers for the live AI surfaces (DESIGN §8.2/§8.4).
// Plain async functions (no "use client" needed) the UI calls to hit /api/ask and
// /api/recommend. Both return the one shape <CitedAnswer/> consumes:
//   { answer (with [n] markers), citations: {label,href}[], refused, source: "ai"|"fallback" }.
// Network/transport failures degrade GRACEFULLY to a refused fallback so the UI never throws.

import type { UserValues } from "@/lib/types";

export interface AskResult {
  /** Answer text containing inline [1], [2]… citation markers. */
  answer: string;
  /** Numbered sources the markers point at (index 1 = citations[0]). */
  citations: { label: string; href: string }[];
  /** True when the evidence didn't support an answer (an honest refusal). */
  refused: boolean;
  /** Whether the live model answered or we served a deterministic fallback. */
  source: "ai" | "fallback";
}

export interface AskArgs {
  entityType: "candidate" | "measure";
  slug: string;
  question: string;
  userValues?: UserValues;
}

export interface RecommendArgs {
  entityType: "candidate" | "measure";
  slug: string;
  userValues?: UserValues;
}

/** A safe, refused fallback for transport-level failures (network down, non-OK status). */
function graceful(message = "Sorry — I couldn't reach the explainer just now."): AskResult {
  return { answer: message, citations: [], refused: true, source: "fallback" };
}

async function postJson(url: string, body: unknown): Promise<AskResult> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return graceful();
    const data = (await res.json()) as Partial<AskResult>;
    return {
      answer: typeof data.answer === "string" ? data.answer : "",
      citations: Array.isArray(data.citations) ? data.citations : [],
      refused: Boolean(data.refused),
      source: data.source === "ai" ? "ai" : "fallback",
    };
  } catch {
    return graceful();
  }
}

/** Ask a grounded question about a candidate or measure → POST /api/ask. */
export function askProcivic(args: AskArgs): Promise<AskResult> {
  return postJson("/api/ask", args);
}

/** Get the personalized "why this fits your values" rationale → POST /api/recommend. */
export function getRecommendation(args: RecommendArgs): Promise<AskResult> {
  return postJson("/api/recommend", args);
}
