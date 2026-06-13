// Procivic — grounded EVIDENCE bundles (DESIGN.md §8.2/§8.4; RUBRIC H1–H3).
//
// The live AI surfaces (/api/ask, /api/recommend) are allowed to use ONLY the text we hand
// the model. This module turns a candidate or measure into a compact, NUMBERED evidence
// string plus the matching `citations` list. Each unique sourceUrl becomes one citation, and
// the evidence text references it inline as [1], [2]… so the model can cite by number and the
// route can echo the exact same citation array back to <CitedAnswer/>.
//
// Pure data assembly: no I/O, no model calls. Keep bundles to a few hundred words — concise
// is more groundable (and cheaper) than dumping the whole record.

import { getCandidate } from "@/lib/candidates";
import { getMeasure } from "@/lib/measures";
import { ISSUES, type IssueId } from "@/config/issues";
import { formatUSD } from "@/lib/utils";

export interface Citation {
  label: string;
  href: string;
}

export interface EvidenceBundle {
  /** Numbered evidence text — the model's ONLY allowed source. */
  evidence: string;
  /** Sources, 1-indexed to match the [n] markers in `evidence`. */
  citations: Citation[];
}

const ISSUE_LABEL: Record<IssueId, string> = Object.fromEntries(
  ISSUES.map((i) => [i.id, i.label]),
) as Record<IssueId, string>;

function issueLabel(issue: string): string {
  return ISSUE_LABEL[issue as IssueId] ?? issue;
}

/**
 * Small helper: dedupes sourceUrls into a numbered citation list and hands back a `cite(url)`
 * that returns the inline marker (e.g. "[2]") for a given url, registering it on first use.
 * Order of citations follows first appearance in the evidence text.
 */
function citationBuilder() {
  const citations: Citation[] = [];
  const indexByHref = new Map<string, number>();

  function cite(href: string | undefined, label: string): string {
    if (!href) return "";
    let idx = indexByHref.get(href);
    if (idx === undefined) {
      citations.push({ label, href });
      idx = citations.length; // 1-indexed
      indexByHref.set(href, idx);
    }
    return `[${idx}]`;
  }

  return { citations, cite };
}

/**
 * Assemble a candidate's evidence: identity, each vote-derived stance + the bill (sourceUrl),
 * top donors + total (funding.sourceUrl), and stated positions (statements, sourceUrls).
 * Returns null if the slug is unknown.
 */
export function buildCandidateEvidence(slug: string): EvidenceBundle | null {
  const c = getCandidate(slug);
  if (!c) return null;

  const { citations, cite } = citationBuilder();
  const lines: string[] = [];

  // Identity.
  const party = c.identity?.party ?? c.party;
  const office = c.identity?.office ?? c.office;
  lines.push(`CANDIDATE: ${c.name} — ${party}, running for ${office}.`);

  // Votes (the primary, hardest evidence). One line per bill, tagged to its issue.
  if (c.votes?.length) {
    lines.push("");
    lines.push("VOTING RECORD (roll-call votes, one representative bill per issue):");
    for (const v of c.votes) {
      const marker = cite(v.sourceUrl, `${v.billId} — ${v.title}`);
      lines.push(
        `- ${issueLabel(v.issue)}: voted ${v.position} on ${v.billId} (${v.title})${
          marker ? ` ${marker}` : ""
        }`,
      );
    }
  }

  // Funding — total + top donors. Single citation for the whole funding picture.
  const f = c.funding;
  if (f && (f.total || f.topDonors?.length)) {
    lines.push("");
    const fundMarker = cite(f.sourceUrl, "Campaign finance (FEC)");
    lines.push(
      `FUNDING: raised ${formatUSD(f.total ?? 0)} this cycle${
        fundMarker ? ` ${fundMarker}` : ""
      }.`,
    );
    const top = (f.topDonors ?? []).slice(0, 6);
    for (const d of top) {
      const who = d.employer && d.employer !== "N/A" ? `${d.name} (${d.employer})` : d.name;
      lines.push(`- ${who}: ${formatUSD(d.amount)}${fundMarker ? ` ${fundMarker}` : ""}`);
    }
  }

  // Stated positions (campaign site) — softer evidence than votes; clearly labeled as stated.
  if (c.statements?.length) {
    lines.push("");
    lines.push("STATED POSITIONS (candidate's own words):");
    for (const s of c.statements) {
      const marker = cite(s.sourceUrl, `${c.name} — stated position (${issueLabel(s.issue)})`);
      lines.push(`- ${issueLabel(s.issue)}: "${s.text}"${marker ? ` ${marker}` : ""}`);
    }
  }

  if (c.dataNote) {
    lines.push("");
    lines.push(`DATA NOTE: ${c.dataNote}`);
  }

  return { evidence: lines.join("\n"), citations };
}

/**
 * Assemble a measure's evidence: plain summary, the support/oppose funding totals + sources,
 * and the election result. Returns null if the slug is unknown.
 */
export function buildMeasureEvidence(slug: string): EvidenceBundle | null {
  const m = getMeasure(slug);
  if (!m) return null;

  const { citations, cite } = citationBuilder();
  const lines: string[] = [];

  // Summary — cite the first sourceUrl as the summary's source if present.
  const summaryMarker = cite(m.sourceUrls?.[0], `${m.code ? `Prop ${m.code} — ` : ""}${m.title}`);
  lines.push(
    `MEASURE: ${m.code ? `Prop ${m.code} — ` : ""}${m.title}.${
      m.subject ? ` ${m.subject}` : ""
    }`,
  );
  lines.push("");
  lines.push(`SUMMARY: ${m.plainSummary}${summaryMarker ? ` ${summaryMarker}` : ""}`);

  // Remaining background sources, so the model can attribute factual claims to them too.
  const extraSources = (m.sourceUrls ?? []).slice(1);
  if (extraSources.length) {
    const markers = extraSources.map((u, i) => cite(u, `Background source ${i + 2}`)).join("");
    if (markers) lines.push(`(Additional background sources: ${markers})`);
  }

  // Funding — support vs. oppose totals.
  const fund = m.funding;
  if (fund) {
    lines.push("");
    const supportTotal = (fund.support ?? []).reduce((s, c) => s + (c.amount ?? 0), 0);
    const opposeTotal = (fund.oppose ?? []).reduce((s, c) => s + (c.amount ?? 0), 0);
    const fundMarker = cite(fund.sourceUrl, "Campaign finance (SF Ethics / DataSF)");
    lines.push("FUNDING (who is spending for / against):");
    lines.push(
      `- Support: ${formatUSD(supportTotal)} across ${
        (fund.support ?? []).length
      } committee(s)${fundMarker ? ` ${fundMarker}` : ""}`,
    );
    for (const c of (fund.support ?? []).slice(0, 3)) {
      lines.push(`  • ${c.committee}: ${formatUSD(c.amount ?? 0)}`);
    }
    if (opposeTotal > 0 || (fund.oppose ?? []).length > 0) {
      lines.push(
        `- Oppose: ${formatUSD(opposeTotal)} across ${
          (fund.oppose ?? []).length
        } committee(s)${fundMarker ? ` ${fundMarker}` : ""}`,
      );
      for (const c of (fund.oppose ?? []).slice(0, 3)) {
        lines.push(`  • ${c.committee}: ${formatUSD(c.amount ?? 0)}`);
      }
    } else {
      lines.push(
        `- Oppose: no financed opposition committee reported${fundMarker ? ` ${fundMarker}` : ""}.`,
      );
    }
    if (fund.notes) lines.push(`  (Funding note: ${fund.notes})`);
  }

  // Result, if the election is settled.
  if (m.result) {
    lines.push("");
    const resultMarker = cite(m.result.sourceUrl, `Prop ${m.code} — official result`);
    lines.push(
      `RESULT: ${m.result.outcome} — Yes ${m.result.yesPct}% / No ${m.result.noPct}%${
        resultMarker ? ` ${resultMarker}` : ""
      }.`,
    );
  }

  return { evidence: lines.join("\n"), citations };
}
