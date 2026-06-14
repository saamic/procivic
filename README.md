# Procivic — *your ballot, decoded*

**Enter your values → get a personalized, evidence-backed recommendation on *every* item of one real ballot — with the receipts one click away.**

The ballot is the **June 2, 2026 San Francisco (CA-11) consolidated primary**: Pelosi's open U.S. House seat, two Supervisor races, the Governor's primary, and four local props (A–D). The home page is an **elections directory** (SF / California, past + upcoming); pick the decoded June-2026 ballot, take a ~60-second values quiz, and Procivic decodes the whole ballot — a recommendation + alignment + one-line why on each item — then lets you drill into any race, candidate, or measure for the voting record, the money, and a cited answer to anything you ask.

> Built solo at **Claude Fable 5 Build Day** (2026-06-13) on **Opus 4.8**. Full product spec: [`DESIGN.md`](./DESIGN.md) · definition of done: [`RUBRIC.md`](./RUBRIC.md) · build memory & data ground-truth: [`NOTES.md`](./NOTES.md).

**Live:** https://procivic.vercel.app

---

## What's different

Every alignment quiz out there (iSideWith and friends) matches you to what politicians *say*. Procivic is built on the **public record** instead:

- **Stances derived from real roll-call VOTES** — Scott Wiener's CA State Senate record via OpenStates, not a questionnaire he filled out.
- **An interactive FUNDING graph** — who actually pays for a candidate / each side of a measure, from OpenFEC and SF-Ethics. The U.S. House race page shows **real FEC funding for every one of the 11 candidates**.
- **A CONFIDENCE score on recommendations** — honest about how much evidence backs each one, and *how much of it covers what **you** care about*.
- **Consistency + transparency** — "said X, voted Y" (stated position vs. the actual vote), plus accountability signals (vote attendance, on-time FEC filing, donor-disclosure completeness) — all source-grounded, shown with their inputs.
- **Every claim CITED**, and a **[`/methodology`](https://procivic.vercel.app/methodology) page** that renders every formula and weight straight from config — no hidden weighting.

**Non-editorializing by design.** Procivic never voices its own opinion. It computes alignment between *the user's* stated values and *the public record*, shows the math, and lets the user override. "Recommended for you: YES — 82%" is a calculation over your inputs + cited evidence, not a take. Where data doesn't exist (challengers with no voting record), it says so and labels the gap (Tier-3) rather than guessing.

---

## The 60-second demo

1. **`/`** — the elections directory. The June-2026 SF ballot is the decoded one: **View** it or **Align me** (take the quiz).
2. **`/quiz`** — 10 ballot-tailored issues, each a **5-point stance scale** + an importance weight. Saved to your browser.
3. **`/ballot`** — every item on the real SF ballot, each with a recommendation + alignment + one-line why; the U.S. House race and the four props lead. *The "decoded ballot" moment.*
4. **`/race/us-house-ca11`** — the open-seat House race: **all 11 candidates with real FEC funding**, your alignment with Wiener, and honest "stated-positions-only" labels for those with no voting record.
5. **`/candidate/scott-wiener`** — collapsible per-issue cards (what he *said*, how he *voted*, what it means, and how it aligns with **you**), the **funding graph**, and consistency + transparency scores. A floating **Ask Procivic** button opens grounded, cited Q&A from anywhere on the page.
6. **A measure** (e.g. `/measure/prop-d-business-tax`) — plain-language summary, who funds each side, your alignment, and Ask.

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

- The **`ingest-ballot`** workflow fetches each ballot item's ground truth, derives stances/scores, and a **fresh adversarial verifier re-fetches the source** to confirm it before anything is written to the static `/data` JSON store (`/data/candidates`, `/data/measures`, `/data/races`, `/data/ballot.json`).
- The **app reads only that store** — zero live calls to OpenStates / OpenFEC / DataSF at request time. Bulletproof demo.
- **Live AI** runs through `/api/recommend` (personalized "why for you") and `/api/ask` (grounded Q&A), both constrained to a verified evidence bundle with mandatory citations and instructed to refuse rather than fabricate. With **no `ANTHROPIC_API_KEY`**, both routes fall back to a deterministic, still-cited answer — the app works fully key-less and never 500s.

---

## Stack

| | |
|---|---|
| Framework | **Next.js 15** (App Router) + **TypeScript** |
| UI | **Tailwind v3** + shadcn-pattern components (Radix primitives), "Civic Daylight" design system |
| Funding graph | `d3-force` (responsive SVG) |
| Data | **Static JSON in-repo** (`/data`) — no DB |
| User state | `localStorage` + React context — **no auth, no database** |
| Scoring | Pure functions in `lib/scoring.ts`, all weights from `config/scoring.config.ts` |
| AI | **Claude** (`claude-opus-4-8`) via route handlers (`@anthropic-ai/sdk`); grounded + cited, deterministic fallback |
| Deploy | **Vercel** (every push auto-deploys) |

## Routes

| Route | Page |
|---|---|
| `/` | Elections directory — SF/CA past + upcoming; View / Align per ballot |
| `/quiz` | Values quiz (5-point stance + importance per issue) |
| `/ballot` | **Your Ballot** — the spine; every item + recommendation |
| `/race/[id]` | Race page — all candidates with FEC funding + alignment (CA-11) |
| `/candidate/[slug]` | Candidate profile (Wiener: stances, votes, funding graph, consistency + transparency, Ask) |
| `/measure/[slug]` | Measure profile (Props A–D: summary, funding, alignment, Ask) |
| `/methodology` | Every formula + weight — the trust artifact |
| `/api/recommend`, `/api/ask` | Grounded AI endpoints |
| `/brand` | Internal design-system reference (not part of the product flow) |

---

## Data sources

- **OpenStates v3** — Scott Wiener's CA State Senate roll-call votes (the vote-derived stances) + vote attendance.
- **OpenFEC** — federal campaign funding: Wiener's itemized donors + total (committee `H8CA11116` / `C00909283`), **and total receipts for every candidate in the CA-11 race**, plus FEC filing timeliness.
- **DataSF SODA** (SF Ethics) — local measure funding, for/against, by committee.
- **Official / SPUR / Ballotpedia / Wikipedia** — plain-language measure summaries and results.

Raw fetched responses are kept under `data/raw/` as the inspectable audit trail.

> Note: the homepage's per-election civic statuses ("Registered", "Voted", …) are **illustrative demo placeholders** — Procivic does not have the user's real voter-registration or turnout data.

---

## How it was built (the orchestration story)

- **`RUBRIC.md` is the machine-verifiable `/goal`** — PASS/FAIL gates; the build hillclimbs until they all pass and may not self-certify.
- **Built in vertical slices** (brand → candidate → quiz/alignment → full ballot → measures → consistency/receipt/Ask → polish/methodology). Each slice was constructed by **parallel section-builder subagents** (one file each) and gated by a **fresh adversarial verifier subagent that re-fetches the sources** — never self-certified. The verifier caught real data errors (an under-counted FEC donor aggregation; a measure result that didn't match its cited source) that were then fixed. See [`ORCHESTRATION.md`](./ORCHESTRATION.md) and the per-slice prompts in [`verifier-prompts.md`](./verifier-prompts.md).
- **Reusable workflows:** [`workflows/ingest-ballot.workflow.js`](./workflows/ingest-ballot.workflow.js) and [`workflows/verify-rubric.workflow.js`](./workflows/verify-rubric.workflow.js) — rerunnable on a new ballot.
- **Memory:** every API quirk / ID-join gotcha is written down in [`NOTES.md`](./NOTES.md) instead of re-derived.
- **Session log:** the full Claude Code build transcript is in the repo (`Claude Code session log for build phase.txt`).

---

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
```

`.env.local` (gitignored — this repo is public) holds the ingest-time API keys.
**`ANTHROPIC_API_KEY` is optional:** with it, `/api/recommend` and `/api/ask` use live Claude; without it, they serve the deterministic cited fallback. Either way the app runs end-to-end. (On Vercel, set `ANTHROPIC_API_KEY` in the project's env vars and redeploy to enable live AI in production.)
