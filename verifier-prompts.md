# Procivic — Verifier sub-agent prompts

> One adversarial verifier per slice. The orchestrator spawns a **fresh `feature-dev:code-reviewer` subagent** with the matching prompt before declaring a slice "done." Output: `{id, pass, evidence}` per gate; **default FAIL**. For a full-rubric sweep, run `workflows/verify-rubric.workflow.js`.

## Shared contract — prepend to EVERY verifier
> You are an **adversarial verifier** with a **fresh context**. Do NOT trust the builder's claims, code comments, or cached values — independently **re-fetch** both the **source** (Congress.gov / OpenFEC / OpenStates / DataSF / official summaries; IDs + quirks are in `NOTES.md`) and the **live URL** (`https://procivic.vercel.app`), then compare. Respect the **OpenStates 500/day + 1 req/sec** cap (sample a few votes; serialize calls). Read `RUBRIC.md` for the authoritative gate text. For each gate below return `{id, pass: boolean, evidence: string}`. **Default `pass:false` whenever you cannot independently confirm**, and put the exact mismatch in `evidence`.

---

## Slice 0 — Brand & design system  · gates: brand + I1, I3
- `BRAND.md` exists and defines a **color schema** (named tokens + hex for the blue / purple / red ramps), gradient + blur recipes, a type scale, a logo, and icon usage.
- The live **`/brand`** page renders the palette, gradients, and **every** shared component (`ScoreChip`, `ConfidenceBadge`, `BallotItemCard`, `FundingGraph` shell, `ProfileShell`, …) with no uncaught console errors.
- **No hardcoded hex** in components — grep `app/` + `components/` for `#[0-9a-fA-F]{3,6}`; color must come from tokens (**I3**: one design system).
- `npm run build` exits 0; layout holds at **375px + 1280px** (**I1**).

## Slice 1 — Candidate profile (Scott Wiener)  · gates: A1–A4, D1, D2, F1–F4, I1, I3
- **A1** build clean · **A2** live URL 200 · **A3** `/candidate/scott-wiener` loads, no uncaught console errors · **A4** repo public, README says what was built today, `.env.local` NOT committed.
- **D1** vote-derived issue stances render across the `config/issues.ts` issues, each traceable to a specific OpenStates vote.
- **D2** voting-history highlights + an interactive funding graph render.
- **F1** identity matches source (Scott Wiener; CA State Senator running in CA-11).
- **F2** re-fetch ≥5 displayed votes from OpenStates (person `ocd-person/de84277e-1c23-4036-bd64-b27c310a1c0e`) and confirm each position matches the real roll-call.
- **F3** re-fetch OpenFEC candidate `H8CA11116`; the displayed top donors/totals match within rounding.
- **F4** confirm the FEC committee belongs to Wiener AND the OpenStates person is the correct Wiener (not a namesake).
- **I1/I3** responsive; brand tokens only, no ad-hoc styling.

## Slice 2 — Intro quiz  · gates: B1–B3, G1
- **B1** the quiz renders the FULL ballot-tailored issue set (all 10 ids in `config/issues.ts`), each with a stance input **and** an importance control; submitting saves a position vector (verify via localStorage).
- **B2** changing an answer changes the downstream recommendation/score (not static).
- **B3** *(bonus)* the "add nuance" chat writes a structured refinement + a free-text note to the vector.
- **G1** recompute alignment yourself from (saved vector × an item's stances) per `config/scoring.config.ts`; it must equal the displayed score.

## Slice 3 — Ballot page  · gates: C1–C3
- **C1** re-derive the real CA-11 ballot from source (US House CA-11, Supervisor race(s), statewide, all 4 props A/B/C/D) and confirm `/ballot` lists **every** item — nothing silently dropped; missing data is **labeled**, not omitted.
- **C2** each item shows a recommendation + a confidence indicator + a one-line "why."
- **C3** every candidate row links to a profile and every measure row links to a profile (follow each link → 200).

## Slice 4 — Measure profiles  · gates: E1–E3, F5
- **E1** each of the 4 props shows a plain-language summary; confirm it's faithful to the official SF voter guide / SPUR / Ballotpedia (cite the source).
- **E2** each prop shows who funds each side, with amounts.
- **E3** each prop shows an alignment-to-you read + recommendation + confidence.
- **F5** re-fetch for/against committee totals from DataSF (Filers `4c8t-ngau`, Summary `9ggq-m8hp`, Transactions `pitq-e56w`); displayed amounts match within rounding, and each committee is on the **correct side** of the prop (watch multi-measure committees like "Yes on C, No on D").

## Slice 5 — Scores + receipt + AI rationale + Ask  · gates: D3, G2–G4, H1–H3
- **D3** consistency + transparency scores render with their inputs visible.
- **G2** confidence shows its inputs (coverage / evidence type / decisiveness). **G3** consistency traces to a specific stated-position source + specific roll-call(s); transparency components shown individually. **G4** no hidden weighting — weights live in `config/scoring.config.ts` and the methodology page renders them.
- **H1** every claim in a recommendation traces to a cited source in the item's evidence bundle. **H2** ask 2–3 questions in the Ask panel: every answer is cited, and asking something the evidence doesn't cover yields a **refusal** ("I don't have a record on that"), NOT a fabrication. **H3** the recommendation's direction matches the alignment math.
