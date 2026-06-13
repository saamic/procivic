// Procivic — POST /api/recommend: a SHORT, personalized "why this fits your values" rationale
// for a candidate or measure (DESIGN §8.2; RUBRIC H).
//
// Contract: body { entityType, slug, userValues }. We build the entity's NUMBERED evidence
// bundle and ask the model for a grounded rationale that references the user's TOP issues with
// [n] citations — stating the user's values vs. the record, never editorializing. Same AI-or-
// fallback contract as /api/ask:
//   { answer (with [n] markers), citations: {label,href}[], refused, source: "ai"|"fallback" }.
// Never 500 on a missing key: no key → deterministic fallback templated from the user's top
// contributing issues (via computeAlignment) + the cited evidence.

import { groundedComplete, AIUnavailable, isAIConfigured } from "@/lib/anthropic";
import {
  buildCandidateEvidence,
  buildMeasureEvidence,
  type EvidenceBundle,
} from "@/lib/evidence";
import { computeAlignment } from "@/lib/scoring";
import { getCandidate } from "@/lib/candidates";
import { getMeasure } from "@/lib/measures";
import { ISSUES, type IssueId } from "@/config/issues";
import type { Stance, UserValues } from "@/lib/types";

interface RecommendBody {
  entityType: "candidate" | "measure";
  slug: string;
  userValues?: UserValues;
}

interface RecommendResponse {
  answer: string;
  citations: { label: string; href: string }[];
  refused: boolean;
  source: "ai" | "fallback";
}

const ISSUE_LABEL: Record<IssueId, string> = Object.fromEntries(
  ISSUES.map((i) => [i.id, i.label]),
) as Record<IssueId, string>;

export async function POST(req: Request): Promise<Response> {
  let body: RecommendBody;
  try {
    body = (await req.json()) as RecommendBody;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { entityType, slug, userValues } = body;
  if (!entityType || !slug) {
    return json({ error: "entityType and slug are required" }, 400);
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

  const topIssues = topContributingIssues(entityType, slug, userValues);
  const issuesNote = topIssues.length
    ? `The user's top issues are: ${topIssues.map((i) => ISSUE_LABEL[i] ?? i).join(", ")}.`
    : "The user has not specified which issues matter most to them.";

  const task =
    "Write a SHORT (2-3 sentence) rationale explaining how this record relates to the user's " +
    "stated values. " +
    issuesNote +
    " Reference the relevant parts of the record and cite the numbered sources inline as [n]. " +
    "State the user's values alongside what the record shows — do NOT editorialize or say " +
    "whether to vote for or against. If the evidence doesn't cover the user's top issues, set " +
    "refused=true and say you don't have a record on those.";

  if (isAIConfigured()) {
    try {
      const result = await groundedComplete(bundle.evidence, task);
      const payload: RecommendResponse = {
        answer: result.answer,
        citations: result.citations.length ? result.citations : bundle.citations,
        refused: result.refused,
        source: "ai",
      };
      return json(payload, 200);
    } catch (err) {
      if (!(err instanceof AIUnavailable)) {
        // Unexpected non-AI failure — still degrade to the fallback rather than 500.
      }
    }
  }

  return json(fallbackRationale(entityType, slug, topIssues, bundle), 200);
}

/**
 * The user's top issues that THIS entity actually has a position on, ranked by their weighted
 * contribution to alignment (importance × base weight). Uses computeAlignment's perIssue output
 * so the fallback talks about the same issues the score is built from.
 */
function topContributingIssues(
  entityType: "candidate" | "measure",
  slug: string,
  values?: UserValues,
): IssueId[] {
  if (!values) return [];
  const stances = entityStances(entityType, slug);
  if (!stances.length) return [];

  const { perIssue } = computeAlignment(values, stances);
  return perIssue
    .slice()
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map((p) => p.issue);
}

/** The entity's stances as a Stance[] — candidates carry them directly; measures use yesPositions. */
function entityStances(entityType: "candidate" | "measure", slug: string): Stance[] {
  if (entityType === "candidate") {
    return getCandidate(slug)?.stances ?? [];
  }
  const m = getMeasure(slug);
  if (!m?.yesPositions) return [];
  // A YES vote moves the issue axis by yesDirection; weight carries the measure's loading.
  return m.yesPositions.map((p) => ({
    issue: p.issue as IssueId,
    value: p.yesDirection,
    basis: "stated" as const,
  }));
}

/**
 * DETERMINISTIC fallback rationale: name the user's top contributing issues, then quote the
 * matching evidence lines (markers preserved so the same citations resolve). REFUSES when the
 * evidence has nothing on the user's issues — no fabrication (RUBRIC H).
 */
function fallbackRationale(
  entityType: "candidate" | "measure",
  slug: string,
  topIssues: IssueId[],
  bundle: EvidenceBundle,
): RecommendResponse {
  const lines = bundle.evidence.split("\n");

  if (topIssues.length === 0) {
    // No issue context — give a neutral, fully-cited summary line rather than refuse outright.
    const firstSubstantive = lines.find(
      (l) => /\[\d+\]/.test(l) && l.trim().length > 0,
    );
    if (!firstSubstantive) {
      return {
        answer: "I don't have a record on your top issues.",
        citations: bundle.citations,
        refused: true,
        source: "fallback",
      };
    }
    return {
      answer:
        "Set your priorities to see how this fits your values. From the record: " +
        firstSubstantive.replace(/^[-•\s]+/, "").trim(),
      citations: bundle.citations,
      refused: false,
      source: "fallback",
    };
  }

  // For each top issue, pull the matching record line(s) by its human label.
  const matched: string[] = [];
  for (const issue of topIssues) {
    const label = (ISSUE_LABEL[issue] ?? issue).toLowerCase();
    const hit = lines.find(
      (l) => l.toLowerCase().includes(label) && /\[\d+\]/.test(l),
    );
    if (hit) matched.push(hit.replace(/^[-•\s]+/, "").trim());
  }

  if (matched.length === 0) {
    return {
      answer: `I don't have a record on your top issues (${topIssues
        .map((i) => ISSUE_LABEL[i] ?? i)
        .join(", ")}).`,
      citations: bundle.citations,
      refused: true,
      source: "fallback",
    };
  }

  const subject = entityType === "candidate" ? "This candidate's" : "This measure's";
  const issueNames = topIssues.map((i) => ISSUE_LABEL[i] ?? i).join(", ");
  const answer =
    `You said ${issueNames} matter most. ${subject} record on those:\n` +
    matched.join("\n");

  return {
    answer,
    citations: bundle.citations,
    refused: false,
    source: "fallback",
  };
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
