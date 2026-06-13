# Procivic — Brief

> **"Your ballot, decoded."**
> Built at Claude Fable 5 Build Day, 2026-06-13 · solo · ~6 hr · submit 5:00 PM · model **Opus 4.8** · public repo.
> Full spec: `DESIGN.md` · Definition of done: `RUBRIC.md` · Verified data ground-truth (IDs, quirks, rate limits): `NOTES.md`.

## The problem
A voter facing a ballot can't easily tell, for each item, **which choice fits their values** or **whether to trust the answer**. Today this is scattered across 3–5 sites, and every alignment quiz matches you to what politicians *say* — never how they *vote* or who *funds* them.

## What we're building
Enter your values → see **every item on one real ballot** → for each, a **personalized recommendation** with a **confidence score** and a **reviewable, cited breakdown**. Drill into any candidate or measure for the receipts: voting record, money ties (an interactive **funding graph**), standardized issue stances, and data-grounded **consistency / transparency** scores — plus an **"Ask Procivic"** box for grounded, cited Q&A on that entity.

## Who it's for
SF voters who want a trustworthy, personalized read on their whole ballot before voting; secondarily journalists / engaged citizens who want the receipts (the contradicting vote, the donor link).

## Scope — one real ballot, covered completely
**The June 2, 2026 San Francisco (CA-11) consolidated primary.** Tiered by data quality (which *is* the confidence score):
- **Tier 1 (deep showcase):** **Scott Wiener** (running for Pelosi's open seat) — CA State Senate votes (OpenStates) + congressional funding (OpenFEC `H8CA11116`) + consistency between his stated positions and his actual votes.
- **Tier 2 (local heart):** the **4 SF props** — A (Earthquake Bond), B (Lifetime Term Limits), C (Small-Business Tax Cuts), D (Business/CEO Tax) — official summaries + SF-Ethics funding (DataSF).
- **Tier 3 (labeled):** Supervisor / statewide races + challengers — funding + stated positions, honestly labeled.

## What "done" looks like
`RUBRIC.md` — machine-verifiable PASS/FAIL gates a verifier sub-agent grades against the live URL + sources. Not done until every gate passes.

## Why it's not a banned project
- **Not a dashboard:** the centerpiece takes an input (your values) and returns a derived verdict (your ballot, recommended). Profiles/graphs are one click in.
- **Not editorializing:** Procivic never voices its own opinion — it computes the **user's** values vs. the **public record**, every claim cited, user-overridable.
- **Not a RAG app / chatbot:** the Ask box is a cited feature *inside* a profile, not the product.

## How to build it (instructions for the Opus 4.8 agent)
1. **Read `DESIGN.md`, `RUBRIC.md`, `NOTES.md` in full first** — the spec, the goal, and the verified data ground-truth (IDs, API quirks, rate limits).
2. **Stack:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui; **static JSON data store** in `/data`; `localStorage` + React context for user state (no auth/DB); Claude via `/api/recommend` + `/api/ask`; deploy to **Vercel**.
3. **Data is precompute-and-verify:** the `ingest-ballot` dynamic workflow fetches → derives stances/scores → **adversarially verifies each item against source** → writes `/data/*.json`. The app reads static JSON; it makes **no live source-API calls at request time** (bulletproof demo).
4. **The loop:** `/goal` = `RUBRIC.md`; hillclimb until all gates pass. Before declaring done, spawn a **verifier sub-agent** (fresh context) that re-fetches sources and grades each gate — **never self-certify**. Append every API quirk to `NOTES.md`.
5. **Build in vertical slices** (`DESIGN.md` §13): ① Tier-1 Wiener profile → ② quiz + alignment + confidence → ③ full ballot → ④ measures → ⑤ consistency/transparency + the receipt + Ask Q&A → ⑥ polish + methodology. Cut from the bottom; **slices 1–3 are the target.**
6. **Deploy a hello-world first**, then every slice auto-deploys.

## Prerequisites
- `api.data.gov` key in `.env.local` ✅ (Congress.gov + OpenFEC).
- `OPENSTATES_API_KEY` in `.env.local` ✅ — **but capped at 500 requests/day:** fetch only curated issue-tagged key votes for Wiener, cache raw responses, and don't re-pull on every ingest run. (Fallback if exhausted: Rep. Mullin via Congress.gov.)
- SF money via DataSF SODA (no key): Filers `4c8t-ngau`, Summary `9ggq-m8hp`, Transactions `pitq-e56w`.
