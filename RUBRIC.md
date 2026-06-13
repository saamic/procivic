# Procivic — RUBRIC.md  (Definition of Done · the `/goal` target)

> The builder hillclimbs against this and may **not** self-certify. Before declaring done, a **verifier sub-agent** (fresh context) re-fetches each source **and** the live URL and returns `{id, pass, evidence}` per gate. **Default `pass:false` when you cannot independently confirm.**
> Target ballot: **June 2, 2026 San Francisco (CA-11) consolidated primary.** Tier-1 subject: **Scott Wiener.** Full spec: `DESIGN.md`. Verified data IDs / API quirks / rate limits: `NOTES.md`.

## A. Build & deploy
- **A1** `npm run build` exits 0, no type errors.
- **A2** Deployed; live URL returns HTTP 200.
- **A3** Core pages (ballot, candidate, measure, methodology) load with no uncaught console errors.
- **A4** Repo public on GitHub; README states what was built today + how to run; `.env.local` gitignored (no key committed).

## B. Onboarding & personalization
- **B1** Quiz renders the full **ballot-tailored** issue set, each with a stance input **and** an importance control; outputs a saved position vector (localStorage).
- **B2** Changing answers changes downstream recommendations (live, not static).
- **B3** *(Bonus)* At least one issue supports agentic "add nuance" that writes a structured refinement + a values note to the vector. Not a blocker for slices 1–3.

## C. Ballot coverage (the spine)
- **C1** Home lists **every** item on the real CA-11 SF ballot (U.S. House CA-11, Supervisor race(s), statewide, all 4 props) — nothing silently dropped; missing data labeled "data unavailable."
- **C2** Each item shows a recommendation + **confidence** + a one-line why.
- **C3** Every candidate links to a profile; every measure links to a profile.

## D. Candidate education (drill-down)
- **D1** Standardized issue stances render — vote-derived for Wiener (OpenStates), labeled stated-position for no-record candidates.
- **D2** Voting-history highlights + an interactive **funding graph** render for the Tier-1 candidate.
- **D3** **Consistency** + **Transparency** render with their inputs visible (Tier-1).
- **D4** "Ask Procivic" panel present, with **intelligently-selected** starter questions.

## E. Measure explainer (drill-down)
- **E1** Each of the 4 props shows a plain-language summary traceable to an official / SPUR / Ballotpedia source.
- **E2** Each prop shows who funds each side (for/against committees) with amounts.
- **E3** Each prop shows an alignment-to-you read + recommendation + confidence.

## F. Data correctness — verified vs. source (N = 5 seeded items)
- **F1** Identity (name, office, party) matches source.
- **F2** ≥5 displayed Wiener votes match the actual **OpenStates** roll-call result.
- **F3** Wiener's top funders match **OpenFEC** (`H8CA11116`) within rounding.
- **F4** ID joins are correct (FEC committee belongs to the candidate; the OpenStates person is the right Wiener).
- **F5** Each measure's for/against totals match **DataSF** (Filers/Summary/Transactions) within rounding.

## G. Score reproducibility
- **G1** Alignment recomputes from (user vector × item stances) = the displayed value.
- **G2** Confidence shows its inputs (coverage / evidence type / decisiveness).
- **G3** Consistency traces to a specific stated-position source + specific roll-call(s); Transparency components shown individually.
- **G4** No hidden/editorial weighting — all weights in `scoring.config.ts` + the methodology page.

## H. AI groundedness
- **H1** Every claim in a recommendation traces to a cited source in the item's evidence bundle.
- **H2** Every Ask-panel answer is cited; it **refuses** (not fabricates) when evidence is absent.
- **H3** Recommendation direction matches the alignment math.

## I. UI quality
- **I1** Layout holds at 375px + 1280px (no overflow/overlap; no hardcoded element sizes).
- **I2** Lighthouse Accessibility ≥ 90 on home + a profile.
- **I3** One design system (shared tokens/components).

## J. Demo readiness
- **J1** The scripted ~60s path (quiz → ballot → Wiener profile w/ funding graph + the receipt → a measure → ask a question) runs end-to-end on the live URL with no code change.

## K. Orchestration evidence (scored by judges — not pass/fail gates)
- **K1** `RUBRIC.md` is in the repo and was the `/goal`.
- **K2** The `ingest-ballot` workflow script is in the repo.
- **K3** The session log shows ≥1 verifier-caught failure the builder then fixed.

---
### How to verify (instructions for the verifier sub-agent)
For each gate, independently fetch the source (Congress.gov / OpenFEC / OpenStates / DataSF / official summaries) **and** the live URL, compare, and return `{id, pass: bool, evidence: string}`. Re-fetch — do not trust the builder's claims or cached values. Default `pass:false` if you cannot independently confirm. Report each failure with the exact mismatch. **Respect the OpenStates 500/day cap** (see `NOTES.md`): verify a small sample of votes, don't re-pull the whole record.
