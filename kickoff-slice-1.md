# Slice 1 — Kickoff prompt

Paste the block below as your **first message** to Claude Code (Opus 4.8) running **inside `Procivic/`**, then run `/goal RUBRIC.md`.

Slice 1 = one deployed, independently-verified **candidate-profile page** for Scott Wiener. (Slices 2–6 are in `DESIGN.md` §13.1; their kickoffs follow the same shape.)

---

> You're building **Procivic** today at a hackathon, on **Opus 4.8**. **Read `BRIEF.md`, `DESIGN.md`, `RUBRIC.md`, and `NOTES.md` in full before doing anything** — BRIEF is the brief, DESIGN is the spec, **RUBRIC is your definition of done (`/goal`)**, NOTES is verified data ground-truth (IDs, API quirks, rate limits). Then read `config/issues.ts`, `config/measures.ts`, `config/scoring.config.ts` — the scoring backbone is **already defined; build on it, do not redefine it**.
>
> The repo is already scaffolded (**Next.js 15 + React 19 + TypeScript + Tailwind v3 at the repo root, no `src/`**) and pushed to `github.com/saamic/procivic`. **Build on the scaffold — do NOT re-scaffold.** shadcn/ui is not yet initialized (`npx shadcn@latest init`).
>
> This session is **SLICE 1 ONLY**: a single, deployed **candidate-profile page** for **Scott Wiener** (running for CA-11, Pelosi's open seat). Do **not** build the quiz, the full ballot, the measures, or the consistency/transparency scores yet.
>
> **Data:** run the **`ingest-ballot` workflow** (`workflows/ingest-ballot.workflow.js`) to fetch + adversarially verify Wiener's data and write `/data/candidates/scott-wiener.json`. All IDs/sources are in `NOTES.md` (OpenStates person `ocd-person/de84277e-…`, FEC `H8CA11116`). **Respect OpenStates 500/day + 1 req/sec** (serialize + cache raw responses). The app reads the static `/data` JSON — it must make **no live source-API calls at request time**.
>
> **Slice 1 is DONE when**, on the **live URL**, the Wiener profile shows: (1) identity matching source; (2) **vote-derived issue stances** across the `config/issues.ts` issues, each traceable to a real OpenStates vote; (3) an **interactive funding graph** whose totals match OpenFEC within rounding; (4) responsive at 375px + 1280px, one design system, no console errors.
>
> **The loop:** treat the above + `RUBRIC.md` gates **A1–A4, D1, D2, F1–F4, I1, I3** as your `/goal`. When you think you're done, spawn a **VERIFIER sub-agent in a fresh context** that does NOT trust your work — it re-fetches from OpenStates / OpenFEC and grades each gate `{id, pass, evidence}`, default FAIL. The `verify` stage of the ingest workflow is the pattern. **Not done until the verifier passes every slice-1 gate.** Append any API quirk you hit to `NOTES.md`.
>
> **Deploy early:** confirm `npm run build` is green and the hello-world deploys to the live URL before adding much, so a broken `main` never breaks the demo. Keep `.env.local` gitignored — never commit a key.
>
> **Before building:** init shadcn/ui, then propose (a) the page scaffold and (b) your data plan, and confirm with me. After I confirm, **work autonomously** — only stop for a genuine blocker or to show the verifier's first pass.

---

**When slice 1's verifier passes**, move to **slice 2** (quiz → alignment + confidence) — same discipline: read the docs, build on the existing structure, gate with a fresh verifier. The slice order and per-slice gates are in `DESIGN.md` §13.1 and `RUBRIC.md`.
