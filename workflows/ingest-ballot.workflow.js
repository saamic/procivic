// Procivic — `ingest-ballot` dynamic workflow.
//
// The orchestration artifact (DESIGN §5/§13, RUBRIC K2): for each June-2026 SF (CA-11)
// ballot item it runs  fetch ground truth -> derive stances/scores per config -> write
// /data JSON  (Ingest), then a FRESH agent re-fetches the source and grades it (Verify).
// The app reads only the static /data store, so the live demo never calls a source API.
//
// Run from Claude Code:  ask to run the `ingest-ballot` workflow (optionally pass `args`
// to override the item list). Re-runs are cheap: agents cache raw responses to /data/raw/.

export const meta = {
  name: 'ingest-ballot',
  description:
    'Fetch + derive + adversarially verify each June-2026 SF (CA-11) ballot item from source, then write the static /data store',
  phases: [
    { title: 'Ingest', detail: 'fetch source APIs, derive stances/scores per config, write /data JSON' },
    { title: 'Verify', detail: 'a fresh agent re-fetches the source and grades each item; default FAIL' },
  ],
}

// --- Items we precompute (DESIGN §3.2). Override via `args` (same shape). ---
const ITEMS = Array.isArray(args) && args.length ? args : [
  {
    kind: 'candidate', slug: 'scott-wiener', name: 'Scott Wiener', tier: 1,
    office: 'U.S. House, CA-11 (Pelosi open seat)',
    fecCandidateId: 'H8CA11116',
    ocdPerson: 'ocd-person/de84277e-1c23-4036-bd64-b27c310a1c0e',
  },
  { kind: 'measure', slug: 'prop-a-earthquake-bond', code: 'A', tier: 2 },
  { kind: 'measure', slug: 'prop-b-term-limits', code: 'B', tier: 2 },
  { kind: 'measure', slug: 'prop-c-small-business-tax-cuts', code: 'C', tier: 2 },
  { kind: 'measure', slug: 'prop-d-business-tax', code: 'D', tier: 2 },
]

const GROUND_RULES =
  'Read DESIGN.md (§7 sources, §8 scoring), NOTES.md (verified IDs, API quirks, rate limits), and ' +
  'config/issues.ts + config/measures.ts + config/scoring.config.ts FIRST — they are ground truth; do ' +
  'NOT re-derive IDs. API keys are in .env.local (CONGRESS_API_KEY / FEC_API_KEY / OPENSTATES_API_KEY). ' +
  'Cite a sourceUrl for every fact; never fabricate (write null + a label if a value is unavailable). ' +
  'OpenStates is capped at 500/day AND 1 req/sec: serialize those calls >=1s apart, cache raw JSON to ' +
  '/data/raw/, and pull only the curated issue-tagged key votes (one bill per issue is enough).'

const CANDIDATE_SCHEMA = {
  type: 'object',
  required: ['slug', 'name', 'identity', 'stances', 'funding', 'writtenPath'],
  properties: {
    slug: { type: 'string' },
    name: { type: 'string' },
    identity: {
      type: 'object', required: ['party', 'office'],
      properties: { party: { type: 'string' }, office: { type: 'string' } },
    },
    votes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['issue', 'billId', 'position', 'direction', 'sourceUrl'],
        properties: {
          issue: { type: 'string' }, billId: { type: 'string' }, title: { type: 'string' },
          position: { type: 'string' }, direction: { type: 'number' }, sourceUrl: { type: 'string' },
        },
      },
    },
    stances: {
      type: 'array',
      items: {
        type: 'object',
        required: ['issue', 'value', 'basis'],
        properties: {
          issue: { type: 'string' }, value: { type: 'number' }, basis: { type: 'string' },
          derivedFrom: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    funding: {
      type: 'object', required: ['total', 'topDonors', 'sourceUrl'],
      properties: {
        total: { type: 'number' }, sourceUrl: { type: 'string' },
        topDonors: {
          type: 'array',
          items: {
            type: 'object', required: ['name', 'amount'],
            properties: {
              name: { type: 'string' }, amount: { type: 'number' },
              employer: { type: 'string' }, kind: { type: 'string' },
            },
          },
        },
      },
    },
    statements: {
      type: 'array',
      items: {
        type: 'object', required: ['issue', 'text', 'sourceUrl'],
        properties: { issue: { type: 'string' }, text: { type: 'string' }, sourceUrl: { type: 'string' } },
      },
    },
    writtenPath: { type: 'string' },
  },
}

const MEASURE_SCHEMA = {
  type: 'object',
  required: ['slug', 'code', 'title', 'plainSummary', 'funding', 'writtenPath'],
  properties: {
    slug: { type: 'string' }, code: { type: 'string' }, title: { type: 'string' },
    plainSummary: { type: 'string' },
    sourceUrls: { type: 'array', items: { type: 'string' } },
    funding: {
      type: 'object', required: ['support', 'oppose', 'sourceUrl'],
      properties: {
        sourceUrl: { type: 'string' },
        support: {
          type: 'array',
          items: {
            type: 'object', required: ['committee', 'amount'],
            properties: { committee: { type: 'string' }, amount: { type: 'number' } },
          },
        },
        oppose: {
          type: 'array',
          items: {
            type: 'object', required: ['committee', 'amount'],
            properties: { committee: { type: 'string' }, amount: { type: 'number' } },
          },
        },
      },
    },
    writtenPath: { type: 'string' },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['slug', 'pass', 'mismatches'],
  properties: {
    slug: { type: 'string' }, pass: { type: 'boolean' },
    mismatches: { type: 'array', items: { type: 'string' } },
  },
}

function ingestCandidate(item) {
  return (
    `${GROUND_RULES}\n\n` +
    `INGEST the Tier-1 candidate ${item.name} (${item.office}).\n` +
    `1) IDENTITY — current CA State Senator; OpenStates person ${item.ocdPerson}; OpenFEC candidate ${item.fecCandidateId}.\n` +
    `2) VOTING RECORD via OpenStates v3 (person ${item.ocdPerson}): for EACH issue in config/issues.ts, find ONE representative CA Senate bill he voted on; record {issue, billId, title, position (Yea/Nay), direction (+1/-1 toward the issue's poles), sourceUrl}.\n` +
    `3) DERIVE a vote-based stance per issue (scoring.config: stance = mean(direction * (votedYea?+1:-1))), basis:'votes', derivedFrom = the billIds.\n` +
    `4) FUNDING via OpenFEC (candidate ${item.fecCandidateId}): principal committee, total receipts, top donors — FILTER to itemized INDIVIDUAL contributions for employer/occupation (NOTES.md quirk). sourceUrl each.\n` +
    `5) STATED POSITIONS: curate 1-2 issue statements from his official campaign site for the consistency score; sourceUrl.\n` +
    `6) WRITE to /data/candidates/${item.slug}.json and return it (set writtenPath).`
  )
}

function ingestMeasure(item) {
  return (
    `${GROUND_RULES}\n\n` +
    `INGEST SF Prop ${item.code} (slug ${item.slug}). config/measures.ts has its issue mapping + committeeNameHints.\n` +
    `1) PLAIN-LANGUAGE SUMMARY from the official SF voter guide / SPUR / Ballotpedia; sourceUrls.\n` +
    `2) FUNDING from DataSF SODA (NOTES.md: Filers 4c8t-ngau, Summary 9ggq-m8hp, Transactions pitq-e56w). Match for/against committees by NAME using committeeNameHints; sum each side's contributions; sourceUrl. A committee may span measures (e.g. "Yes on C, No on D") — attribute to the correct side of Prop ${item.code}.\n` +
    `3) Carry the yesPositions from config/measures.ts.\n` +
    `4) WRITE to /data/measures/${item.slug}.json and return it (set writtenPath).`
  )
}

function verifyPrompt(item, data) {
  return (
    `${GROUND_RULES}\n\n` +
    `ADVERSARIALLY VERIFY the ingested data for "${item.slug}" against the SOURCE. Do NOT trust it — re-fetch and compare.\n` +
    `Data: ${JSON.stringify(data)}\n` +
    (item.kind === 'candidate'
      ? `Check: (a) >=5 votes match the real OpenStates roll-call result; (b) the OpenFEC committee belongs to ${item.fecCandidateId}; (c) top-donor totals match OpenFEC within rounding; (d) each stance recomputes from its votes per scoring.config.\n`
      : `Check: (a) the plain summary is faithful to the official source; (b) for/against committee totals match DataSF within rounding; (c) each committee is attributed to the correct side of Prop ${item.code}.\n`) +
    `Respect the OpenStates 500/day + 1/sec cap (sample a few votes, don't re-pull everything). ` +
    `Default pass:false if you cannot independently confirm. List every mismatch precisely.`
  )
}

phase('Ingest')
const nMeasures = ITEMS.filter((i) => i.kind === 'measure').length
log(`Ingesting ${ITEMS.length} ballot items (${ITEMS.length - nMeasures} candidate + ${nMeasures} measures)`)

const results = await pipeline(
  ITEMS,
  // Stage 1 — ingest from source, derive per config, write /data JSON
  (item) =>
    agent(item.kind === 'candidate' ? ingestCandidate(item) : ingestMeasure(item), {
      label: `ingest:${item.slug}`,
      phase: 'Ingest',
      schema: item.kind === 'candidate' ? CANDIDATE_SCHEMA : MEASURE_SCHEMA,
    }),
  // Stage 2 — adversarial verify in a fresh context
  (data, item) =>
    agent(verifyPrompt(item, data), {
      label: `verify:${item.slug}`,
      phase: 'Verify',
      schema: VERDICT_SCHEMA,
    }).then((verdict) => ({ item, data, verdict })),
)

const ok = results.filter(Boolean)
const passed = ok.filter((r) => r.verdict?.pass)
const flagged = ok.filter((r) => !r.verdict?.pass)
log(`✅ ${passed.length} verified · ⚠️ ${flagged.length} flagged`)

return {
  verified: passed.map((r) => r.item.slug),
  flagged: flagged.map((r) => ({ slug: r.item.slug, mismatches: r.verdict?.mismatches ?? ['no verdict returned'] })),
  dataFiles: ok.map((r) => r.data?.writtenPath).filter(Boolean),
}
