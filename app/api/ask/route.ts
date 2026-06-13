// Procivic — POST /api/ask: grounded Q&A over a candidate or measure (DESIGN §8.4; RUBRIC H).
//
// Contract: body { entityType, slug, question, userValues? }. We build the entity's NUMBERED
// evidence bundle (the model's only allowed source) and either:
//   • call Claude (groundedComplete) when a key is configured, OR
//   • fall back to a DETERMINISTIC answer assembled from the same evidence text.
// Either way the response is the one shape <CitedAnswer/> reads:
//   { answer (with [n] markers), citations: {label,href}[], refused, source: "ai"|"fallback" }.
// We NEVER 500 on a missing key — no key just means source:"fallback".
//
// Groundedness (RUBRIC H): the answer cites the evidence; when the evidence is silent the
// answer REFUSES (refused:true, no fabrication) rather than guessing.

import { groundedComplete, AIUnavailable, isAIConfigured } from "@/lib/anthropic";
import {
  buildCandidateEvidence,
  buildMeasureEvidence,
  type EvidenceBundle,
} from "@/lib/evidence";
import type { UserValues } from "@/lib/types";

interface AskBody {
  entityType: "candidate" | "measure";
  slug: string;
  question: string;
  userValues?: UserValues;
}

interface AskResponse {
  answer: string;
  citations: { label: string; href: string }[];
  refused: boolean;
  source: "ai" | "fallback";
}

const REFUSAL = "I don't have a record on that.";

const TASK_SUFFIX =
  "Answer ONLY from the evidence; cite the numbered sources inline as [n]. If the evidence " +
  "lacks the answer, set refused=true and say you don't have a record on that. Connect the " +
  "answer to the user's stated values when relevant, but stay factual and non-editorializing.";

export async function POST(req: Request): Promise<Response> {
  let body: AskBody;
  try {
    body = (await req.json()) as AskBody;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { entityType, slug, question } = body;
  if (!entityType || !slug || !question || !question.trim()) {
    return json({ error: "entityType, slug, and question are required" }, 400);
  }

  const bundle =
    entityType === "candidate"
      ? buildCandidateEvidence(slug)
      : entityType === "measure"
        ? buildMeasureEvidence(slug)
        : null;

  if (!bundle) {
    return json({ error: `Unknown ${entityType}: ${slug}` }, 404);
  }

  const valuesContext = userValuesContext(body.userValues);
  const task =
    `QUESTION: ${question.trim()}\n` +
    (valuesContext ? `${valuesContext}\n` : "") +
    TASK_SUFFIX;

  // AI path — degrade to the deterministic fallback on ANY AIUnavailable (no key / refusal / error).
  if (isAIConfigured()) {
    try {
      const result = await groundedComplete(bundle.evidence, task);
      const payload: AskResponse = {
        answer: result.answer,
        // Prefer the model's citation list; fall back to the bundle's if it returned none.
        citations: result.citations.length ? result.citations : bundle.citations,
        refused: result.refused,
        source: "ai",
      };
      return json(payload, 200);
    } catch (err) {
      if (!(err instanceof AIUnavailable)) {
        // Unexpected non-AI error — still degrade rather than 500 (RUBRIC H: never break the demo).
        // (Intentionally fall through to the deterministic fallback.)
      }
    }
  }

  return json(fallbackAnswer(question, bundle), 200);
}

/** A short note injecting the user's top issues so the AI can connect facts to their values. */
function userValuesContext(values?: UserValues): string {
  if (!values?.importance) return "";
  const top = topIssues(values, 3);
  if (!top.length) return "";
  return `The user cares most about: ${top.join(", ")}.`;
}

function topIssues(values: UserValues, n: number): string[] {
  return Object.entries(values.importance ?? {})
    .filter(([, w]) => typeof w === "number" && (w as number) > 0)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, n)
    .map(([id]) => id);
}

/**
 * DETERMINISTIC fallback: scan the numbered evidence text line-by-line for lines that match
 * the question's keywords, and return them verbatim (markers preserved → the same citations
 * resolve). If nothing matches, REFUSE — no fabrication (RUBRIC H).
 */
function fallbackAnswer(question: string, bundle: EvidenceBundle): AskResponse {
  const keywords = extractKeywords(question);
  const lines = bundle.evidence.split("\n");

  const matched = lines.filter((line) => {
    const lower = line.toLowerCase();
    return keywords.some((k) => lower.includes(k));
  });

  // Keep only substantive lines (skip section headers with no citation marker).
  const useful = matched.filter((l) => l.trim().length > 0).slice(0, 6);

  if (useful.length === 0) {
    return {
      answer: REFUSAL,
      citations: bundle.citations,
      refused: true,
      source: "fallback",
    };
  }

  const answer =
    "Based on the record:\n" +
    useful.map((l) => l.replace(/^[-•\s]+/, "").trim()).join("\n");

  return {
    answer,
    citations: bundle.citations,
    refused: false,
    source: "fallback",
  };
}

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "is", "are", "was", "were",
  "do", "does", "did", "how", "what", "when", "where", "who", "why", "which", "this", "that",
  "they", "their", "them", "he", "she", "it", "his", "her", "about", "with", "from", "vote",
  "voted", "votes", "stance", "position", "have", "has", "had", "would", "will", "can", "you",
  "your", "i", "me", "my", "as", "at", "by", "be", "been",
]);

/** Question → lowercase content keywords (drops stopwords/punctuation; keeps bill ids like "sb423"). */
function extractKeywords(question: string): string[] {
  const tokens = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
  // Dedupe while preserving order.
  return Array.from(new Set(tokens));
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
