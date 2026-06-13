# Procivic — *your ballot, decoded*

**Enter your values → get a personalized, evidence-backed recommendation on *every* item of one real ballot — with the receipts one click away.**

The ballot is the **June 2, 2026 San Francisco (CA-11) consolidated primary**: Pelosi's open U.S. House seat, two Supervisor races, the Governor's primary, and four local props (A–D). You take a ~60-second values quiz; Procivic decodes the whole ballot for you — a recommendation pill + confidence + one-line why on each item — then lets you drill into any candidate or measure for the voting record, the money, and a cited answer to anything you ask.

> Built solo at **Claude Fable 5 Build Day** (2026-06-13) on **Opus 4.8**. Full product spec: [`DESIGN.md`](./DESIGN.md) · definition of done: [`RUBRIC.md`](./RUBRIC.md) · build memory & data ground-truth: [`NOTES.md`](./NOTES.md).

**Live:** https://procivic.vercel.app

---

## What's different

Every alignment quiz out there (iSideWith and friends) matches you to what politicians *say*. Procivic is built on the **public record** instead:

- **Stances derived from real roll-call VOTES** — Scott Wiener's CA State Senate record via OpenStates, not a questionnaire he filled out.
- **An interactive FUNDING graph** — who actually pays for a candidate / each side of a measure, from OpenFEC and SF-Ethics.
- **A CONFIDENCE score on every item** — honest about how much evidence backs each recommendation (and *how much of it covers what **you** care about*).
- **Consistency — "said X, voted Y"** — the contradiction between a stated position and the actual vote, surfaced as a receipt.
- **Every claim CITED**, and a **[`/methodology`](https://procivic.vercel.app/methodology) page** that shows every formula and weight — no hidden weighting.

**Non-editorializing by design.** Procivic never voices its own opinion. It computes alignment between *the user's* stated values and *the public record*, shows the math, and lets the user override. "Recommended for you: YES — 82%, high confidence" is a calculation over your inputs + cited evidence, not a take.

---

## The 60-second demo

1. **`/quiz`** — ~8–12 ballot-tailored issues, each with a stance slider + an importance weight. Saved to your browser.
2. **`/ballot`** — every item on the real SF ballot, each with a recommendation pill, confidence, and a one-line why. *This is the "decoded ballot" moment.*
3. **`/candidate/scott-wiener`** — alignment + vote-derived stances + the **funding graph** + the consistency receipt.
4. **A measure** (e.g. `/measure/prop-d-business-tax`) — plain-language summary, who funds each side, your alignment.
5. **Ask Procivic** — on any profile, ask "how did they vote on housing?" / "who funds the NO side?" and get a **cited** answer (it refuses rather than guesses when the record is silent).

Change a quiz answer and the whole ballot re-scores instantly.

---

## Architecture — precompute-and-verify

The single biggest demo risk is a live source API failing on stage, so **no source API is hit at request time.**

```
ingest-ballot workflow  ──fetch · join IDs · derive stances/scores · adversarially verify vs source──►  /data/*.json  (committed)
                                                                                                              │ read at build / request time
Next.js app (Vercel)  ◄──────────────────────────────────────────────────────────────────────────────────┘
   + /api/recommend, /api/ask → Claude (grounded + cited; deterministic fallback so it runs key-less)
```

- The **`ingest-ballot`** workflow fetches each ballot item's ground truth, derives stances/scores, and a **fresh adversarial verifier re-fetches the source** to confirm it before anything is written to the static `/data` JSON store.
- The **app reads only that store** — zero live calls to OpenStates / OpenFEC / DataSF at request time. Bulletproof demo.
- **Live AI** runs through `/api/recommend` (personalized "why for you") and `/api/ask` (grounded Q&A), both constrained to a verified evidence bundle with mandatory citations. With **no `ANTHROPIC_API_KEY`**, both routes fall back to a deterministic templated answer — the app works fully key-less and never 500s.

---

## Stack

| | |
|---|---|
| Framework | **Next.js 15** (App Router) + **TypeScript** |
| UI | **Tailwind v3** + shadcn-pattern components (Radix primitives) |
| Funding graph | `d3-force` |
| Data | **Static JSON in-repo** (`/data`) — no DB |
| User state | `localStorage` + React context — **no auth, no database** |
| AI | **Claude** via route handlers (`@anthropic-ai/sdk`); grounded + cited, with deterministic fallback |
| Deploy | **Vercel** (every push auto-deploys) |

## Routes

| Route | Page |
|---|---|
| `/` | Landing — value prop + CTA |
| `/quiz` | Values quiz (stance + importance per issue) |
| `/ballot` | **Your Ballot** — the spine; every item + recommendation pill |
| `/candidate/[slug]` | Candidate profile (Wiener: votes, stances, funding graph, consistency) |
| `/measure/[slug]` | Measure profile (Props A–D) |
| `/methodology` | Every formula + weight — the trust artifact |
| `/brand` | The design system |
| `/api/recommend`, `/api/ask` | Grounded AI endpoints |

---

## Data sources

- **OpenStates v3** — Scott Wiener's CA State Senate roll-call votes (the vote-derived stances).
- **OpenFEC** — federal campaign funding (committee `H8CA11116`).
- **DataSF SODA** (SF Ethics) — local measure funding, for/against, by committee.
- **Official / SPUR / Ballotpedia** — plain-language measure summaries.

Raw fetched responses are kept under `data/raw/` as the inspectable audit trail.

---

## How it was built (the orchestration story)

- **`RUBRIC.md` is the machine-verifiable `/goal`** — PASS/FAIL gates; the build hillclimbs until they all pass and may not self-certify.
- **Built in vertical slices** (brand → candidate → quiz/alignment → full ballot → measures → consistency/receipt/Ask → polish/methodology). Each slice was constructed by **parallel section-builder subagents** and gated by a **fresh adversarial verifier subagent that re-fetches the sources** — never self-certified. See [`ORCHESTRATION.md`](./ORCHESTRATION.md).
- **Reusable workflows:** [`workflows/ingest-ballot.workflow.js`](./workflows/ingest-ballot.workflow.js) and [`workflows/verify-rubric.workflow.js`](./workflows/verify-rubric.workflow.js) — rerunnable on a new ballot.
- **Memory:** every API quirk / ID-join gotcha is written down in [`NOTES.md`](./NOTES.md) instead of re-derived.

---

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
```

`.env.local` (gitignored — this repo is public) holds the ingest-time API keys.
**`ANTHROPIC_API_KEY` is optional:** with it, `/api/recommend` and `/api/ask` use live Claude; without it, they serve the deterministic fallback. Either way the app runs end-to-end.
