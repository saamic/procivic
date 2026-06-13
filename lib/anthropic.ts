// Procivic — Claude API client (server-only). Powers the LIVE /api/recommend rationale and
// /api/ask grounded Q&A (DESIGN §8.2/§8.4). Two hard rules baked in here:
//   1. GROUNDED: the model may use ONLY the evidence bundle we pass; every claim cites a
//      numbered source ([n]) and it must REFUSE rather than invent when the answer isn't there.
//   2. KEY-OPTIONAL: with no ANTHROPIC_API_KEY the helpers throw AIUnavailable, and the route
//      handlers fall back to deterministic templated output — so the demo never breaks.
//
// Model: claude-opus-4-8 by default (capable, fast enough for a live demo), overridable via
// ANTHROPIC_MODEL. Bounded grounding tasks → effort "low" + structured JSON output for speed.

import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export const AI_MODEL = process.env.ANTHROPIC_MODEL?.trim() || "claude-opus-4-8";

/** Is a live Claude key configured? Routes branch on this to pick AI vs. deterministic fallback. */
export function isAIConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

/** Thrown when the key is absent or the model declines/cannot answer — callers fall back. */
export class AIUnavailable extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIUnavailable";
  }
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!isAIConfigured()) {
    throw new AIUnavailable("ANTHROPIC_API_KEY not set");
  }
  if (!client) client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
  return client;
}

/** The shape every grounded surface returns: prose with [n] markers + the cited sources. */
export interface GroundedResult {
  /** Answer text containing inline [1], [2]… citation markers. */
  answer: string;
  /** Numbered sources the markers point at (index 1 = citations[0]). */
  citations: { label: string; href: string }[];
  /** True when the evidence doesn't support an answer (an honest refusal, not a guess). */
  refused: boolean;
}

const GROUNDED_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    answer: {
      type: "string",
      description:
        "The answer, grounded ONLY in the provided evidence, with inline [n] markers citing the numbered sources. If the evidence does not contain the answer, briefly say so here.",
    },
    citations: {
      type: "array",
      description: "The sources referenced by the [n] markers, in order (1-indexed).",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          label: { type: "string" },
          href: { type: "string" },
        },
        required: ["label", "href"],
      },
    },
    refused: {
      type: "boolean",
      description: "true if the evidence does not support an answer (no fabrication).",
    },
  },
  required: ["answer", "citations", "refused"],
};

const GROUNDING_CONTRACT =
  "You are Procivic's grounded explainer. You may use ONLY the evidence provided in the user " +
  "message — never outside knowledge. Every factual claim must cite a numbered source with an " +
  "inline [n] marker that indexes the Sources list you return. If the evidence does not contain " +
  "the answer, set refused=true and say you don't have a record on that — do NOT guess. " +
  "Procivic never editorializes: state what the record shows and how it relates to the user's " +
  "stated values; never give your own opinion on whether a candidate or measure is good or bad. " +
  "Be concise and specific.";

/**
 * Run one grounded completion. `evidence` is the entity's verified bundle (votes, funding,
 * stances, summary, the user's values) rendered as text with a numbered Sources list; `task`
 * is the question or rationale instruction. Returns a GroundedResult. Throws AIUnavailable on
 * no-key, refusal, or API error so the caller can render the deterministic fallback.
 */
export async function groundedComplete(
  evidence: string,
  task: string
): Promise<GroundedResult> {
  const anthropic = getClient();
  let message: Anthropic.Message;
  try {
    message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 1024,
      system: GROUNDING_CONTRACT,
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: GROUNDED_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: `EVIDENCE BUNDLE (your only allowed source):\n${evidence}\n\nTASK:\n${task}`,
        },
      ],
    });
  } catch (err) {
    throw new AIUnavailable(`Claude request failed: ${(err as Error).message}`);
  }

  if (message.stop_reason === "refusal") {
    throw new AIUnavailable("model refused");
  }

  const text = message.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") {
    throw new AIUnavailable("no text in response");
  }

  let parsed: GroundedResult;
  try {
    parsed = JSON.parse(text.text) as GroundedResult;
  } catch {
    throw new AIUnavailable("unparseable structured output");
  }
  return {
    answer: parsed.answer ?? "",
    citations: Array.isArray(parsed.citations) ? parsed.citations : [],
    refused: Boolean(parsed.refused),
  };
}
